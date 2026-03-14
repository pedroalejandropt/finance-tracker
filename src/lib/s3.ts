import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'finance-tracker-data';

export class S3Storage {
  static async uploadData(key: string, data: any): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(data),
        ContentType: 'application/json',
      });

      await s3Client.send(command);
      return key;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error('Failed to upload data to S3');
    }
  }

  static async getData(key: string): Promise<any> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      const body = await response.Body?.transformToString();
      return body ? JSON.parse(body) : null;
    } catch (error) {
      console.error('Error fetching from S3:', error);
      return null;
    }
  }

  static async deleteData(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('Error deleting from S3:', error);
      throw new Error('Failed to delete data from S3');
    }
  }

  static async listUserFiles(userId: string): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `users/${userId}/`,
      });

      const response = await s3Client.send(command);
      return response.Contents?.map((obj) => obj.Key!).filter(Boolean) || [];
    } catch (error) {
      console.error('Error listing S3 files:', error);
      return [];
    }
  }

  static async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  static getUserKey(userId: string, dataType: string): string {
    return `users/${userId}/${dataType}.json`;
  }

  static async saveUserData(userId: string, dataType: string, data: any): Promise<string> {
    const key = this.getUserKey(userId, dataType);
    return await this.uploadData(key, data);
  }

  static async getUserData(userId: string, dataType: string): Promise<any> {
    const key = this.getUserKey(userId, dataType);
    return await this.getData(key);
  }

  static async deleteUserData(userId: string, dataType: string): Promise<void> {
    const key = this.getUserKey(userId, dataType);
    return await this.deleteData(key);
  }
}
