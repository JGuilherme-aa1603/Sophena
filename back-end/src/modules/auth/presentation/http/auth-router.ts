import { Router } from "express";
import rateLimit from "express-rate-limit";

import { AuthService } from "../../application/auth-service.ts";
import {
  ForbiddenError,
  InvalidCredentialsError,
  ResourceNotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../application/auth-errors.ts";
import { authService } from "../../composition/auth-module.ts";

export function createAuthRouter() {
  const router = Router();
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
      handleAuthError(error, response);
    }
  });

  router.post("/logout", async (request, response) => {
    try {
      const result = await authService.logout(readRefreshTokenFromCookie(request.header("cookie")));

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

  return router;
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
