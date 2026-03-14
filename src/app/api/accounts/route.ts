import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Account } from '@/types';
import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const ACCOUNTS_TABLE = process.env.AWS_DYNAMODB_ACCOUNTS_TABLE || 'finance-tracker-accounts';

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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDynamoConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const user = await fetch(`${process.env.NEXTAUTH_URL}/api/user`, {
      headers: { cookie: request.headers.get('cookie') || '' },
    });
    const userData = await user?.json();

    const command = new QueryCommand({
      TableName: ACCOUNTS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: marshall({ ':userId': userData.profile }),
    });

    const response = await getDynamoClient().send(command);
    const accounts = response.Items
      ? response.Items.map((item) => unmarshall(item) as Account)
      : [];
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error getting accounts:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDynamoConfigured()) {
    return NextResponse.json({ error: 'DynamoDB not configured' }, { status: 503 });
  }

  try {
    const account: Account = await request.json();
    const now = new Date().toISOString();

    const command = new PutItemCommand({
      TableName: ACCOUNTS_TABLE,
      Item: marshall({
        ...account,
        userId: session.user.email,
        createdAt: now,
        updatedAt: now,
      }),
    });

    await getDynamoClient().send(command);
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error saving account:', error);
    return NextResponse.json({ error: 'Failed to save account' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDynamoConfigured()) {
    return NextResponse.json({ error: 'DynamoDB not configured' }, { status: 503 });
  }

  try {
    const { accountId } = await request.json();

    const command = new DeleteItemCommand({
      TableName: ACCOUNTS_TABLE,
      Key: marshall({ id: accountId, userId: session.user.email }),
    });

    await getDynamoClient().send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
