import { randomUUID } from "node:crypto";

import { toAuthenticatedUserView, type AuthUser } from "../domain/auth-user.ts";
import { UnauthorizedError, ValidationError } from "./auth-errors.ts";

export type UserPictureImageProcessor = {
  compressBookCover(input: {
    bytes: Buffer;
    mimeType: string;
  }): Promise<{
    bytes: Buffer;
    contentType: string;
    extension: string;
  }>;
};

export type UserPictureStorage = {
  putObject(input: {
    key: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
  }): Promise<{
    url: string;
  }>;
  deleteObjectByUrl(url: string): Promise<void>;
};

export type UserPictureRepository = {
  findById(userId: string): Promise<AuthUser | null>;
  updateUserPictureUrl(input: {
    userId: string;
    user_picture_url: string | null;
  }): Promise<AuthUser | null>;
};

export type UpdateUserPictureInput = {
  userId: string;
  mimeType: string;
  bytes: Buffer;
};

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export class UserPictureService {
  constructor(
    private readonly userPictureRepository: UserPictureRepository,
    private readonly imageProcessor: UserPictureImageProcessor,
    private readonly storage: UserPictureStorage,
  ) {}

  async updatePicture(input: UpdateUserPictureInput) {
    validateUpdateUserPictureInput(input);

    const currentUser = await this.userPictureRepository.findById(input.userId);

    if (!currentUser) {
      throw new UnauthorizedError();
    }

    const compressedImage = await this.imageProcessor.compressBookCover({
      bytes: input.bytes,
      mimeType: input.mimeType,
    });
    const uploadResult = await this.storage.putObject({
      key: `user-pictures/${randomUUID()}.${compressedImage.extension}`,
      body: compressedImage.bytes,
      contentType: compressedImage.contentType,
      cacheControl: "public, max-age=31536000, immutable",
    });

    const updatedUser = await this.userPictureRepository.updateUserPictureUrl({
      userId: input.userId,
      user_picture_url: uploadResult.url,
    });

    if (!updatedUser) {
      throw new UnauthorizedError();
    }

    if (currentUser.user_picture_url) {
      await this.storage.deleteObjectByUrl(currentUser.user_picture_url);
    }

    return toAuthenticatedUserView(updatedUser);
  }

  async removePicture(userId: string) {
    const currentUser = await this.userPictureRepository.findById(userId);

    if (!currentUser) {
      throw new UnauthorizedError();
    }

    if (currentUser.user_picture_url) {
      await this.storage.deleteObjectByUrl(currentUser.user_picture_url);
    }

    const updatedUser = await this.userPictureRepository.updateUserPictureUrl({
      userId,
      user_picture_url: null,
    });

    if (!updatedUser) {
      throw new UnauthorizedError();
    }

    return toAuthenticatedUserView(updatedUser);
  }
}

function validateUpdateUserPictureInput(input: UpdateUserPictureInput) {
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
