import { randomUUID } from "node:crypto";

import { ValidationError } from "../../auth/application/auth-errors.ts";

export type ImageProcessor = {
  compressBookCover(input: {
    bytes: Buffer;
    mimeType: string;
  }): Promise<{
    bytes: Buffer;
    contentType: string;
    extension: string;
  }>;
};

export type ObjectStorage = {
  putObject(input: {
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
  }): Promise<{
    url: string;
  }>;
};

export type UploadBookCoverInput = {
  originalFileName: string;
  mimeType: string;
  bytes: Buffer;
  objectKeyPrefix?: string;
};

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export class BookCoverUploadService {
  constructor(
    private readonly imageProcessor: ImageProcessor,
    private readonly objectStorage: ObjectStorage,
  ) {}

  async uploadBookCover(input: UploadBookCoverInput) {
    validateUploadBookCoverInput(input);

    const compressedImage = await this.imageProcessor.compressBookCover({
      bytes: input.bytes,
      mimeType: input.mimeType,
    });

    const keyPrefix = input.objectKeyPrefix ?? "book-covers";
    const objectKey = `${keyPrefix}/${randomUUID()}.${compressedImage.extension}`;
    const result = await this.objectStorage.putObject({
      key: objectKey,
      body: compressedImage.bytes,
      contentType: compressedImage.contentType,
      cacheControl: "public, max-age=31536000, immutable",
    });

    return {
      url: result.url,
    };
  }
}

function validateUploadBookCoverInput(input: UploadBookCoverInput) {
  const errors: Array<{ field: string; message: string }> = [];

  if (input.bytes.length === 0) {
    errors.push({
      field: "file",
      message: "file must not be empty",
    });
  }

  if (!SUPPORTED_IMAGE_TYPES.has(input.mimeType)) {
    errors.push({
      field: "file",
      message: "file must be a JPEG, PNG, or WebP image",
    });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}
