import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const USERS_TABLE = process.env.AWS_DYNAMODB_USERS_TABLE || 'finance-tracker-users';

function getDynamoClient() {
  return new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

function isDynamoConfigured() {
  return !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDynamoConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const command = new QueryCommand({
      TableName: USERS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: marshall({ ':userId': session.user.email }),
    });

    const response = await getDynamoClient().send(command);
    const users = response.Items
      ? response.Items.map((item) => unmarshall(item) as Record<string, unknown>)
      : [];
    const user = users?.[0];
    if (!user) throw new Error('User not found');
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json({});
  }
}
