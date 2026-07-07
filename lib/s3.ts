import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export function getS3Client(): S3Client {
  const s3Config: {
    region: string;
    endpoint?: string;
    forcePathStyle?: boolean;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  } = {
    region: process.env.AWS_REGION ?? "us-east-1",
  };

  if (process.env.AWS_ENDPOINT) {
    s3Config.endpoint = process.env.AWS_ENDPOINT;
    s3Config.forcePathStyle = true;

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }
  }

  return new S3Client(s3Config);
}

/**
 * Upload a file buffer to S3 and return the public URL.
 * Key format: chat-assets/{userId}/{chatId}/{filename}
 */
export async function uploadToS3(params: {
  userId: string;
  chatId: string;
  filename: string;
  mediaType: string;
  data: Uint8Array;
}): Promise<{ s3Key: string; s3Url: string }> {
  const { userId, chatId, filename, mediaType, data } = params;
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error("S3_BUCKET env var is not set");
  }

  const s3Key = `chat-assets/${userId}/${chatId}/${filename}`;
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: data,
      ContentType: mediaType,
    })
  );

  // Build the public URL
  const publicUrlBase = process.env.S3_PUBLIC_URL;
  let s3Url: string;
  if (publicUrlBase) {
    s3Url = `${publicUrlBase}/${s3Key}`;
  } else {
    const endpoint =
      process.env.AWS_ENDPOINT ||
      `https://s3.${process.env.AWS_REGION ?? "us-east-1"}.amazonaws.com`;
    s3Url = `${endpoint}/${bucket}/${s3Key}`;
  }

  return { s3Key, s3Url };
}
