import { AuthContextService } from "../application/auth-context-service.ts";
import { AuthService } from "../application/auth-service.ts";
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
