import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Stock } from '@/types';
import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const STOCKS_TABLE = process.env.AWS_DYNAMODB_STOCKS_TABLE || 'finance-tracker-stocks';

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
      TableName: STOCKS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: marshall({ ':userId': userData.profile }),
    });

    const response = await getDynamoClient().send(command);
    const stocks = response.Items ? response.Items.map((item) => unmarshall(item) as Stock) : [];
    return NextResponse.json(stocks);
  } catch (error) {
    console.error('Error getting stocks:', error);
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
    const stock: Stock = await request.json();
    const now = new Date().toISOString();

    const command = new PutItemCommand({
      TableName: STOCKS_TABLE,
      Item: marshall({
        ...stock,
        userId: session.user.email,
        createdAt: now,
        updatedAt: now,
      }),
    });

    await getDynamoClient().send(command);
    return NextResponse.json(stock);
  } catch (error) {
    console.error('Error saving stock:', error);
    return NextResponse.json({ error: 'Failed to save stock' }, { status: 500 });
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
    const { symbol } = await request.json();

    const command = new DeleteItemCommand({
      TableName: STOCKS_TABLE,
      Key: marshall({ symbol, userId: session.user.email }),
    });

    await getDynamoClient().send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stock:', error);
    return NextResponse.json({ error: 'Failed to delete stock' }, { status: 500 });
  }
}
