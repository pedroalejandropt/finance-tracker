import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
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

export interface DbUser {
  userId: string;
  email: string;
  profile: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const command = new QueryCommand({
    TableName: USERS_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: marshall({ ':userId': email }),
  });

  const response = await getClient().send(command);
  if (!response.Items || response.Items.length === 0) return null;
  return unmarshall(response.Items[0]) as DbUser;
}

export async function createUser(user: DbUser): Promise<void> {
  const command = new PutItemCommand({
    TableName: USERS_TABLE,
    Item: marshall(user),
    ConditionExpression: 'attribute_not_exists(userId)',
  });

  await getClient().send(command);
}
