import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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
}

function removeTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
