import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CurrencyRate } from '@/types';
import { DynamoDBClient, QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const RATES_TABLE = process.env.AWS_DYNAMODB_RATES_TABLE || 'finance-tracker-rates';

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

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || 'USD';

  try {
    const command = new QueryCommand({
      TableName: RATES_TABLE,
      KeyConditionExpression: '#fromCurrency = :from',
      ExpressionAttributeNames: { '#fromCurrency': 'from' },
      ExpressionAttributeValues: marshall({ ':from': from }),
    });

    const response = await getDynamoClient().send(command);
    const rates = response.Items
      ? response.Items.map((item) => {
          const raw = unmarshall(item);
          return { ...raw, timestamp: new Date(raw.timestamp) } as CurrencyRate;
        })
      : [];
    return NextResponse.json(rates);
  } catch (error) {
    console.error('Error getting currency rates:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  console.log('POST request received');
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDynamoConfigured()) {
    return NextResponse.json({ error: 'DynamoDB not configured' }, { status: 503 });
  }

  try {
    const rate: CurrencyRate = await request.json();

    const timestamp = new Date(rate.timestamp).toISOString();
    const command = new PutItemCommand({
      TableName: RATES_TABLE,
      Item: marshall({
        fromCurrency: rate.from,
        'toCurrency#timestamp': `${rate.to}#${timestamp}`,
        from: rate.from,
        to: rate.to,
        rate: rate.rate,
        timestamp,
      }),
    });

    await getDynamoClient().send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving currency rate:', error);
    return NextResponse.json({ error: 'Failed to save currency rate' }, { status: 500 });
  }
}
