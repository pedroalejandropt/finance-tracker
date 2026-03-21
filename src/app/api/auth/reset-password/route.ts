import { NextRequest, NextResponse } from 'next/server';
import { validateResetToken, clearResetToken } from '@/lib/password-reset';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const USERS_TABLE = process.env.AWS_DYNAMODB_USERS_TABLE || 'finance-tracker-users';

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8),
});

function getClient() {
  return new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { email, token, password } = parsed.data;

    const isValid = await validateResetToken(email, token);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const command = new UpdateItemCommand({
      TableName: USERS_TABLE,
      Key: marshall({ userId: email }),
      UpdateExpression: 'SET passwordHash = :hash',
      ExpressionAttributeValues: marshall({ ':hash': passwordHash }),
    });

    await getClient().send(command);
    await clearResetToken(email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
