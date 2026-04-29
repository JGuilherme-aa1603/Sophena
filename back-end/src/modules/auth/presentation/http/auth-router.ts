import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";

import { AuthService } from "../../application/auth-service.ts";
import {
  ForbiddenError,
  InvalidCredentialsError,
  ResourceNotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../application/auth-errors.ts";
import {
  authService,
  createUserPictureService,
  readImageMaxUploadBytes,
} from "../../composition/auth-module.ts";
import { logService } from "../../../logs/composition/log-module.ts";
import { requireAuthenticatedUser } from "./security-middleware.ts";
import { type AuthenticatedUserView } from "../../domain/auth-user.ts";
import type { UserPictureService } from "../../application/user-picture-service.ts";

type AuthRouterLocals = {
  authenticatedUser?: AuthenticatedUserView;
};

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function createAuthRouter(input: {
  userPictureService?: Pick<UserPictureService, "updatePicture" | "removePicture">;
} = {}) {
  const router = Router();
  const multipartUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: readImageMaxUploadBytes(),
    },
  });
  const loginRateLimiter = createAuthRateLimiter({
    maxEnvVar: "AUTH_LOGIN_RATE_LIMIT_MAX",
    defaultMax: 5,
  });
  const refreshRateLimiter = createAuthRateLimiter({
    maxEnvVar: "AUTH_REFRESH_RATE_LIMIT_MAX",
    defaultMax: 10,
  });

  router.post("/login", loginRateLimiter, async (request, response) => {
    try {
      const result = await authService.login(request.body ?? {});

      await writeAuditLogSafely({
        level: "INFO",
        status_code: 200,
        message: "Login successful",
        route: "/auth/login",
        method: "POST",
        user_id: result.user.id,
      });

      response.cookie("refresh_token", result.refresh_token, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: 15 * 24 * 60 * 60 * 1000,
        path: "/auth",
      });

      response.status(200).json({
        access_token: result.access_token,
        user: result.user,
      });
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        await writeAuditLogSafely({
          level: "WARN",
          status_code: 401,
          message: "Login failed",
          route: "/auth/login",
          method: "POST",
        });
      }

      handleAuthError(error, response);
    }
  });

  router.post("/refresh", refreshRateLimiter, async (request, response) => {
    try {
      const result = await authService.refresh(readRefreshTokenFromCookie(request.header("cookie")));

      response.cookie("refresh_token", result.refresh_token, {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        maxAge: 15 * 24 * 60 * 60 * 1000,
        path: "/auth",
      });

      response.status(200).json({
        access_token: result.access_token,
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        await writeAuditLogSafely({
          level: "WARN",
          status_code: 401,
          message: "Invalid refresh attempt",
          route: "/auth/refresh",
          method: "POST",
        });
      }

      handleAuthError(error, response);
    }
  });

  router.post("/logout", async (request, response) => {
    try {
      const refreshToken = readRefreshTokenFromCookie(request.header("cookie"));
      const userId = authService.readRefreshTokenUserId(refreshToken);
      const result = await authService.logout(refreshToken);

      await writeAuditLogSafely({
        level: "INFO",
        status_code: 200,
        message: "Logout successful",
        route: "/auth/logout",
        method: "POST",
        user_id: userId ?? null,
      });

      response.clearCookie("refresh_token", {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        path: "/auth",
      });

      response.status(200).json(result);
    } catch (error) {
      handleAuthError(error, response);
    }
  });

  router.get("/me", async (request, response) => {
    try {
      const user = await authService.me(request.header("authorization"));

      response.status(200).json(user);
    } catch (error) {
      handleAuthError(error, response);
    }
  });

  router.patch("/me/picture", requireAuthenticatedUser, multipartUpload.single("file"), async (request, response) => {
    try {
      const authenticatedUser = ensureAuthenticatedUser(response);

      if (!request.file) {
        throw new ValidationError([
          {
            field: "file",
            message: "file is required",
          },
        ]);
      }

      if (!SUPPORTED_IMAGE_TYPES.has(request.file.mimetype)) {
        throw new ValidationError([
          {
            field: "file",
            message: "file must be a JPEG, PNG, or WebP image",
          },
        ]);
      }

      const user = await (input.userPictureService ?? createUserPictureService()).updatePicture({
        userId: authenticatedUser.id,
        mimeType: request.file.mimetype,
        bytes: request.file.buffer,
      });

      response.status(200).json(user);
    } catch (error) {
      handleAuthError(error, response);
    }
  });

  router.delete("/me/picture", requireAuthenticatedUser, async (_request, response) => {
    try {
      const authenticatedUser = ensureAuthenticatedUser(response);
      const user = await (input.userPictureService ?? createUserPictureService()).removePicture(authenticatedUser.id);

      response.status(200).json(user);
    } catch (error) {
      handleAuthError(error, response);
    }
  });

  return router;
}

function ensureAuthenticatedUser(response: { locals: AuthRouterLocals }) {
  const authenticatedUser = response.locals.authenticatedUser;

  if (!authenticatedUser) {
    throw new UnauthorizedError();
  }

  return authenticatedUser;
}

async function writeAuditLogSafely(
  input: Parameters<typeof logService.createLog>[0],
) {
  try {
    await logService.createLog(input);
  } catch {
    // Logging must never change auth response behavior.
  }
}

function createAuthRateLimiter(input: {
  maxEnvVar: "AUTH_LOGIN_RATE_LIMIT_MAX" | "AUTH_REFRESH_RATE_LIMIT_MAX";
  defaultMax: number;
}) {
  return rateLimit({
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? "60000"),
    max: Number(process.env[input.maxEnvVar] ?? String(input.defaultMax)),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Too many requests",
    },
  });
}

function readRefreshTokenFromCookie(cookieHeader?: string) {
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const refreshCookie = cookies.find((cookie) => cookie.startsWith("refresh_token="));

  if (!refreshCookie) {
    return undefined;
  }

  const refreshToken = refreshCookie.slice("refresh_token=".length);
  return refreshToken.length > 0 ? refreshToken : undefined;
}

function handleAuthError(error: unknown, response: RouterResponse) {
  if (error instanceof ValidationError) {
    response.status(400).json({
      message: "Validation failed",
      errors: error.errors,
    });
    return;
  }

  if (error instanceof InvalidCredentialsError) {
    response.status(401).json({
      message: "Invalid credentials",
    });
    return;
  }

  if (error instanceof UnauthorizedError) {
    response.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  if (error instanceof ForbiddenError) {
    response.status(403).json({
      message: "Forbidden",
    });
    return;
  }

  if (error instanceof ResourceNotFoundError) {
    response.status(404).json({
      message: "Resource not found",
    });
    return;
  }

  response.status(500).json({
    message: "Internal server error",
  });
}

type RouterResponse = {
  status(code: number): RouterResponse;
  json(body: unknown): void;
};
