import { createHash } from "node:crypto";

import { prisma } from "../../../../infrastructure/prisma/prisma-client.ts";
import { type RefreshTokenPayload, type RefreshTokenStore } from "../../application/auth-service.ts";

export class PrismaRefreshTokenStore implements RefreshTokenStore {
  async register(token: string, payload: RefreshTokenPayload) {
    await prisma.refreshToken.create({
      data: {
        token_hash: hashToken(token),
        user_id: payload.sub,
        expires_at: new Date(payload.exp * 1000),
      },
    });
  }

  async rotate(currentToken: string, nextToken: string, nextPayload: RefreshTokenPayload) {
    const currentTokenHash = hashToken(currentToken);
    const nextTokenHash = hashToken(nextToken);

    return prisma.$transaction(async (transaction) => {
      const now = new Date();

      const currentTokenUpdate = await transaction.refreshToken.updateMany({
        where: {
          token_hash: currentTokenHash,
          revoked_at: null,
          expires_at: {
            gt: now,
          },
        },
        data: {
          revoked_at: now,
        },
      });

      if (currentTokenUpdate.count !== 1) {
        return false;
      }

      await transaction.refreshToken.create({
        data: {
          token_hash: nextTokenHash,
          user_id: nextPayload.sub,
          expires_at: new Date(nextPayload.exp * 1000),
        },
      });

      return true;
    });
  }

  async invalidate(token: string) {
    const tokenHash = hashToken(token);
    const now = new Date();

    const result = await prisma.refreshToken.updateMany({
      where: {
        token_hash: tokenHash,
        revoked_at: null,
      },
      data: {
        revoked_at: now,
      },
    });

    return result.count === 1;
  }

  async isActive(token: string) {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: {
        token_hash: hashToken(token),
      },
    });

    if (!refreshToken) {
      return false;
    }

    if (refreshToken.revoked_at) {
      return false;
    }

    if (refreshToken.expires_at <= new Date()) {
      return false;
    }

    return true;
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
