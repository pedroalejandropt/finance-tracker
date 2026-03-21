import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Transaction } from '@/types';
import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const TRANSACTIONS_TABLE =
  process.env.AWS_DYNAMODB_TRANSACTIONS_TABLE || 'finance-tracker-transactions';

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
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDynamoConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const command = new QueryCommand({
      TableName: TRANSACTIONS_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: marshall({ ':userId': session.user.id }),
      ScanIndexForward: false, // most recent first
    });

    const response = await getDynamoClient().send(command);
    const transactions = response.Items
      ? response.Items.map((item) => unmarshall(item) as Transaction)
      : [];
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDynamoConfigured()) {
    return NextResponse.json({ error: 'DynamoDB not configured' }, { status: 503 });
  }

  try {
    const body: Omit<Transaction, 'transactionId' | 'createdAt'> = await request.json();
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...body,
      transactionId: uuidv4(),
      createdAt: now,
    };

    const command = new PutItemCommand({
      TableName: TRANSACTIONS_TABLE,
      Item: marshall({
        ...transaction,
        userId: session.user.id,
      }),
    });

    await getDynamoClient().send(command);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error saving transaction:', error);
    return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDynamoConfigured()) {
    return NextResponse.json({ error: 'DynamoDB not configured' }, { status: 503 });
  }

  try {
    const { transactionId, ...updates }: Transaction = await request.json();

    const command = new UpdateItemCommand({
      TableName: TRANSACTIONS_TABLE,
      Key: marshall({ transactionId, userId: session.user.id }),
      UpdateExpression:
        'SET #type = :type, category = :category, amount = :amount, currency = :currency, description = :description, #date = :date, accountId = :accountId',
      ExpressionAttributeNames: { '#type': 'type', '#date': 'date' },
      ExpressionAttributeValues: marshall({
        ':type': updates.type,
        ':category': updates.category,
        ':amount': updates.amount,
        ':currency': updates.currency,
        ':description': updates.description,
        ':date': updates.date,
        ':accountId': updates.accountId,
      }),
      ReturnValues: 'ALL_NEW',
    });

    const response = await getDynamoClient().send(command);
    const updated = response.Attributes ? unmarshall(response.Attributes) : null;
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDynamoConfigured()) {
    return NextResponse.json({ error: 'DynamoDB not configured' }, { status: 503 });
  }

  try {
    const { transactionId } = await request.json();

    const command = new DeleteItemCommand({
      TableName: TRANSACTIONS_TABLE,
      Key: marshall({ transactionId, userId: session.user.id }),
    });

    await getDynamoClient().send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
