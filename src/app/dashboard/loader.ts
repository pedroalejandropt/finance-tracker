import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Account, Stock } from '@/types';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const ACCOUNTS_TABLE = process.env.AWS_DYNAMODB_ACCOUNTS_TABLE || 'finance-tracker-accounts';
const STOCKS_TABLE = process.env.AWS_DYNAMODB_STOCKS_TABLE || 'finance-tracker-stocks';
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

async function getUserProfile(client: DynamoDBClient, email: string): Promise<string | null> {
  try {
    const command = new QueryCommand({
      TableName: USERS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: marshall({ ':userId': email }),
    });
    const response = await client.send(command);
    const users = response.Items ? response.Items.map((item) => unmarshall(item)) : [];
    const user = users[0];
    return user ? (user.profile as string) : null;
  } catch (error) {
    console.error('Error fetching user profile in loader:', error);
    return null;
  }
}

export async function loadDashboardData(): Promise<{ accounts: Account[]; stocks: Stock[] }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { accounts: [], stocks: [] };

  if (!isDynamoConfigured()) {
    return { accounts: [], stocks: [] };
  }

  const client = getDynamoClient();

  // Resolve the user's profile identifier (used as userId in accounts/stocks tables)
  const userEmail = session.user.email ?? '';
  const userProfile = await getUserProfile(client, userEmail);
  const userId = userProfile ?? userEmail;

  try {
    const [accountsResult, stocksResult] = await Promise.all([
      client.send(
        new QueryCommand({
          TableName: ACCOUNTS_TABLE,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: marshall({ ':userId': userId }),
        })
      ),
      client.send(
        new QueryCommand({
          TableName: STOCKS_TABLE,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: marshall({ ':userId': userId }),
        })
      ),
    ]);

    const accounts = accountsResult.Items
      ? accountsResult.Items.map((item) => unmarshall(item) as Account)
      : [];

    const stocks = stocksResult.Items
      ? stocksResult.Items.map((item) => unmarshall(item) as Stock)
      : [];

    return { accounts, stocks };
  } catch (error) {
    console.error('Error loading dashboard data server-side:', error);
    return { accounts: [], stocks: [] };
  }
}
