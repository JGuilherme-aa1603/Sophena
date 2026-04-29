import { AuthContextService } from "../application/auth-context-service.ts";
import { AuthService } from "../application/auth-service.ts";
import {
  UserPictureService,
  type UserPictureImageProcessor,
  type UserPictureStorage,
} from "../application/user-picture-service.ts";
import {
  getBookCoverObjectStorage,
  readImageMaxUploadBytes,
} from "../../uploads/composition/upload-module.ts";
import { SharpImageProcessor } from "../../uploads/infrastructure/image-processing/sharp-image-processor.ts";
import { PrismaAuthUserRepository } from "../infrastructure/persistence/prisma-auth-user-repository.ts";
import { PrismaRefreshTokenStore } from "../infrastructure/persistence/prisma-refresh-token-store.ts";
import { HmacTokenService } from "../infrastructure/security/token-service.ts";

const authUserRepository = new PrismaAuthUserRepository();
const tokenService = new HmacTokenService();
const refreshTokenStore = new PrismaRefreshTokenStore();

export const authService = new AuthService(
  authUserRepository,
  tokenService,
  refreshTokenStore,
);

export const authContextService = new AuthContextService(
  authUserRepository,
  tokenService,
);

export function createUserPictureService(input: {
  userPictureImageProcessor?: UserPictureImageProcessor;
  userPictureStorage?: UserPictureStorage;
} = {}) {
  return new UserPictureService(
    authUserRepository,
    input.userPictureImageProcessor
      ?? new SharpImageProcessor({
        maxWidth: readPositiveIntegerEnv("IMAGE_MAX_WIDTH", 1200),
        webpQuality: readPositiveIntegerEnv("IMAGE_WEBP_QUALITY", 80),
      }),
    input.userPictureStorage ?? getBookCoverObjectStorage(),
  );
}

export type { UserPictureImageProcessor, UserPictureStorage };
export { readImageMaxUploadBytes };

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
