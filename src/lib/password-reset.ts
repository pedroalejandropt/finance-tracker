import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import crypto from 'crypto';

const USERS_TABLE = process.env.AWS_DYNAMODB_USERS_TABLE || 'finance-tracker-users';
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function getClient() {
  return new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

/** Generate a secure random token and persist it (hashed) against the user record. */
export async function createResetToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  // Store hash + expiry on the user record (userId = email per existing schema)
  const command = new UpdateItemCommand({
    TableName: USERS_TABLE,
    Key: marshall({ userId: email }),
    UpdateExpression: 'SET resetTokenHash = :hash, resetTokenExpiresAt = :exp',
    ExpressionAttributeValues: marshall({ ':hash': tokenHash, ':exp': expiresAt }),
    ConditionExpression: 'attribute_exists(userId)',
  });

  await getClient().send(command);
  return token; // return plain token to embed in the email link
}

/** Validate a token and return the email if valid, or null if expired/invalid. */
export async function validateResetToken(email: string, token: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const command = new GetItemCommand({
    TableName: USERS_TABLE,
    Key: marshall({ userId: email }),
  });

  const response = await getClient().send(command);
  if (!response.Item) return false;

  const user = unmarshall(response.Item);
  if (!user.resetTokenHash || !user.resetTokenExpiresAt) return false;
  if (user.resetTokenHash !== tokenHash) return false;
  if (new Date(user.resetTokenExpiresAt) < new Date()) return false;

  return true;
}

/** Clear the reset token after use. */
export async function clearResetToken(email: string): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: USERS_TABLE,
    Key: marshall({ userId: email }),
    UpdateExpression: 'REMOVE resetTokenHash, resetTokenExpiresAt',
  });

  await getClient().send(command);
}

// Re-export for convenience
export { PutItemCommand, GetItemCommand, DeleteItemCommand };
