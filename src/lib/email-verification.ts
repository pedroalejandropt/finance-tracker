import crypto from 'crypto';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const USERS_TABLE = process.env.AWS_DYNAMODB_USERS_TABLE || 'finance-tracker-users';

function getClient() {
  return new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createVerificationToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = hashToken(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const command = new UpdateItemCommand({
    TableName: USERS_TABLE,
    Key: marshall({ userId: email }),
    UpdateExpression:
      'SET emailVerificationToken = :hash, emailVerificationExpires = :expires, emailVerified = :verified',
    ExpressionAttributeValues: marshall({
      ':hash': hash,
      ':expires': expiresAt,
      ':verified': false,
    }),
  });

  await getClient().send(command);
  return token;
}

export async function validateVerificationToken(email: string, token: string): Promise<boolean> {
  const command = new GetItemCommand({
    TableName: USERS_TABLE,
    Key: marshall({ userId: email }),
  });

  const response = await getClient().send(command);
  if (!response.Item) return false;

  const user = unmarshall(response.Item) as {
    emailVerificationToken?: string;
    emailVerificationExpires?: string;
    emailVerified?: boolean;
  };

  if (!user.emailVerificationToken || !user.emailVerificationExpires) return false;

  const hash = hashToken(token);
  if (hash !== user.emailVerificationToken) return false;

  if (new Date(user.emailVerificationExpires) < new Date()) return false;

  return true;
}

export async function markEmailVerified(email: string): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: USERS_TABLE,
    Key: marshall({ userId: email }),
    UpdateExpression:
      'SET emailVerified = :verified REMOVE emailVerificationToken, emailVerificationExpires',
    ExpressionAttributeValues: marshall({
      ':verified': true,
    }),
  });

  await getClient().send(command);
}
