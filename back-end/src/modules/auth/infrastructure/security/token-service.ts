import crypto from "node:crypto";

import jwt, { type JwtPayload } from "jsonwebtoken";

import { type AuthUser } from "../../domain/auth-user.ts";
import {
  type AccessTokenPayload,
  type RefreshTokenPayload,
  type TokenService,
} from "../../application/auth-service.ts";

const ACCESS_TOKEN_LIFETIME_IN_SECONDS = 30 * 60;
const REFRESH_TOKEN_LIFETIME_IN_SECONDS = 15 * 24 * 60 * 60;

export class HmacTokenService implements TokenService {
  createAccessToken(user: AuthUser): string {
    return jwt.sign(
      {
        user_name: user.user_name,
        is_admin: user.is_admin,
      },
      getRequiredSecret("ACCESS_TOKEN_SECRET"),
      {
        subject: user.id,
        expiresIn: ACCESS_TOKEN_LIFETIME_IN_SECONDS,
        algorithm: "HS256",
      },
    );
  }

  createRefreshToken(user: AuthUser): string {
    return jwt.sign(
      {
        type: "refresh",
      },
      getRequiredSecret("REFRESH_TOKEN_SECRET"),
      {
        subject: user.id,
        expiresIn: REFRESH_TOKEN_LIFETIME_IN_SECONDS,
        algorithm: "HS256",
        jwtid: crypto.randomUUID(),
      },
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      const payload = jwt.verify(
        token,
        getRequiredSecret("ACCESS_TOKEN_SECRET"),
        {
          algorithms: ["HS256"],
        },
      );

      return parseAccessPayload(payload);
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      const payload = jwt.verify(
        token,
        getRequiredSecret("REFRESH_TOKEN_SECRET"),
        {
          algorithms: ["HS256"],
        },
      );

      return parseRefreshPayload(payload);
    } catch {
      return null;
    }
  }
}

function parseAccessPayload(payload: string | JwtPayload): AccessTokenPayload | null {
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.user_name !== "string" ||
    typeof payload.is_admin !== "boolean"
  ) {
    return null;
  }

  return {
    sub: payload.sub,
    user_name: payload.user_name,
    is_admin: payload.is_admin,
  };
}

function parseRefreshPayload(payload: string | JwtPayload): RefreshTokenPayload | null {
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    payload.type !== "refresh" ||
    typeof payload.jti !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  return {
    sub: payload.sub,
    jti: payload.jti,
    type: "refresh",
    exp: payload.exp,
  };
}

function getRequiredSecret(secretName: "ACCESS_TOKEN_SECRET" | "REFRESH_TOKEN_SECRET") {
  const secret = process.env[secretName];

  if (!secret) {
    throw new Error(`${secretName} is required`);
  }

  return secret;
}
