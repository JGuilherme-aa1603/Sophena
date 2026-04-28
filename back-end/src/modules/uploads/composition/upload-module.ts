import { BookCoverUploadService } from "../application/book-cover-upload-service.ts";
import { SharpImageProcessor } from "../infrastructure/image-processing/sharp-image-processor.ts";
import { R2ObjectStorage } from "../infrastructure/storage/r2-object-storage.ts";

let cachedBookCoverUploadService: BookCoverUploadService | undefined;
let cachedBookCoverObjectStorage: R2ObjectStorage | undefined;

export function getBookCoverUploadService() {
  if (!cachedBookCoverUploadService) {
    cachedBookCoverUploadService = new BookCoverUploadService(
      new SharpImageProcessor({
        maxWidth: readPositiveIntegerEnv("IMAGE_MAX_WIDTH", 1200),
        webpQuality: readPositiveIntegerEnv("IMAGE_WEBP_QUALITY", 80),
      }),
      getBookCoverObjectStorage(),
    );
  }

  return cachedBookCoverUploadService;
}

export function getBookCoverObjectStorage() {
  if (!cachedBookCoverObjectStorage) {
    cachedBookCoverObjectStorage = new R2ObjectStorage({
      endpoint: readRequiredEnv("R2_ENDPOINT"),
      bucketName: readRequiredEnv("R2_BUCKET_NAME"),
      accessKeyId: readRequiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: readRequiredEnv("R2_SECRET_ACCESS_KEY"),
      publicBaseUrl: readRequiredEnv("R2_PUBLIC_BASE_URL"),
      region: process.env.R2_REGION ?? "auto",
    });
  }

  return cachedBookCoverObjectStorage;
}

export function readImageMaxUploadBytes() {
  return readPositiveIntegerEnv("IMAGE_MAX_UPLOAD_BYTES", 5 * 1024 * 1024);
}

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function readPositiveIntegerEnv(name: string, fallbackValue: number) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallbackValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsedValue;
}
