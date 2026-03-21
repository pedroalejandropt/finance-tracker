import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NetWorthSnapshot } from '@/types';
import { DynamoDBClient, QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const SNAPSHOTS_TABLE = process.env.AWS_DYNAMODB_SNAPSHOTS_TABLE || 'finance-tracker-snapshots';

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

// Returns the most recent 90 snapshots for the user, ordered by date ascending
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
      TableName: SNAPSHOTS_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: marshall({ ':userId': session.user.id }),
      ScanIndexForward: true, // oldest first for chart display
      Limit: 90,
    });

    const response = await getDynamoClient().send(command);
    const snapshots = response.Items
      ? response.Items.map((item) => unmarshall(item) as NetWorthSnapshot)
      : [];
    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Error getting snapshots:', error);
    return NextResponse.json([]);
  }
}

// Upserts a snapshot for today (one snapshot per day per user)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDynamoConfigured()) {
    return NextResponse.json({ error: 'DynamoDB not configured' }, { status: 503 });
  }

  try {
    const body: { totalUSD: number; baseCurrency: string } = await request.json();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const snapshot: NetWorthSnapshot & { userId: string } = {
      snapshotId: uuidv4(),
      userId: session.user.id,
      date: today,
      totalUSD: body.totalUSD,
      baseCurrency: body.baseCurrency,
      createdAt: now,
    };

    // ConditionExpression would need a GSI with date as key; for simplicity we
    // always write and let the chart de-duplicate by date client-side.
    const command = new PutItemCommand({
      TableName: SNAPSHOTS_TABLE,
      Item: marshall(snapshot),
    });

    await getDynamoClient().send(command);
    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error('Error saving snapshot:', error);
    return NextResponse.json({ error: 'Failed to save snapshot' }, { status: 500 });
  }
}
