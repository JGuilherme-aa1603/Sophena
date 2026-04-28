import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export class R2ObjectStorage {
  private readonly s3Client: S3Client;

  constructor(
    private readonly config: {
      endpoint: string;
      bucketName: string;
      accessKeyId: string;
      secretAccessKey: string;
      publicBaseUrl: string;
      region: string;
    },
  ) {
    this.s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async putObject(input: {
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
  }) {
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl,
    }));

    return {
      url: `${removeTrailingSlash(this.config.publicBaseUrl)}/${input.key}`,
    };
  }

  async deleteObjectByUrl(url: string) {
    const objectKey = this.readManagedObjectKey(url);

    if (!objectKey) {
      return;
    }

    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: objectKey,
    }));
  }

  private readManagedObjectKey(url: string) {
    const normalizedBaseUrl = removeTrailingSlash(this.config.publicBaseUrl);

    if (!url.startsWith(`${normalizedBaseUrl}/`)) {
      return null;
    }

    const objectKey = url.slice(normalizedBaseUrl.length + 1);
    return objectKey.length > 0 ? objectKey : null;
  }
}

function removeTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
