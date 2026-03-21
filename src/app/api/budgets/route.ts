import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Budget } from '@/types';
import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
const BUDGETS_TABLE = process.env.AWS_DYNAMODB_BUDGETS_TABLE || 'finance-tracker-budgets';

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
      TableName: BUDGETS_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: marshall({ ':userId': session.user.id }),
    });

    const response = await getDynamoClient().send(command);
    const budgets = response.Items ? response.Items.map((item) => unmarshall(item) as Budget) : [];
    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Error getting budgets:', error);
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
    const body: Omit<Budget, 'budgetId' | 'createdAt'> = await request.json();
    const now = new Date().toISOString();
    const budgetId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    const newBudget: Budget = {
      ...body,
      budgetId,
      createdAt: now,
    };

    const command = new PutItemCommand({
      TableName: BUDGETS_TABLE,
      Item: marshall({
        ...newBudget,
        userId: session.user.id,
      }),
    });

    await getDynamoClient().send(command);
    return NextResponse.json(newBudget);
  } catch (error) {
    console.error('Error saving budget:', error);
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 });
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
    const { budgetId, ...updates }: Partial<Budget> & { budgetId: string } = await request.json();

    const command = new UpdateItemCommand({
      TableName: BUDGETS_TABLE,
      Key: marshall({ budgetId, userId: session.user.id }),
      UpdateExpression:
        'SET #name = :name, category = :category, #limit = :limit, currency = :currency, period = :period',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#limit': 'limit',
      },
      ExpressionAttributeValues: marshall({
        ':name': updates.name,
        ':category': updates.category,
        ':limit': updates.limit,
        ':currency': updates.currency,
        ':period': updates.period,
      }),
    });

    await getDynamoClient().send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
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
    const { budgetId } = await request.json();

    const command = new DeleteItemCommand({
      TableName: BUDGETS_TABLE,
      Key: marshall({ budgetId, userId: session.user.id }),
    });

    await getDynamoClient().send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
  }
}
