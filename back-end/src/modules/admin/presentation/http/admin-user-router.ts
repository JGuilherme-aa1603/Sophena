import { Router } from "express";

import {
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
} from "../../../auth/application/auth-errors.ts";
import {
  requireAdminUser,
  requireAuthenticatedUser,
} from "../../../auth/presentation/http/security-middleware.ts";
import { type AuthenticatedUserView } from "../../../auth/domain/auth-user.ts";
import { adminUserService } from "../../composition/admin-user-module.ts";
import { AdminUserNameConflictError } from "../../application/admin-user-errors.ts";

type AdminUserRouterResponseLocals = {
  authenticatedUser?: AuthenticatedUserView;
};

export function createAdminUserRouter() {
  const router = Router();

  router.post("/users", requireAuthenticatedUser, requireAdminUser, async (request, response) => {
    try {
      ensureAuthenticatedUser(response);
      const result = await adminUserService.createUser(request.body ?? {});
      response.status(201).json(result);
    } catch (error) {
      handleAdminUserError(error, response);
    }
  });

  return router;
}

function ensureAuthenticatedUser(response: { locals: AdminUserRouterResponseLocals }) {
  if (!response.locals.authenticatedUser) {
    throw new UnauthorizedError();
  }
}

function handleAdminUserError(error: unknown, response: AdminUserRouterResponse) {
  if (error instanceof ValidationError) {
    response.status(400).json({
      message: "Validation failed",
      errors: error.errors,
    });
    return;
  }

  if (error instanceof AdminUserNameConflictError) {
    response.status(409).json({
      message: "User name already exists",
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

  response.status(500).json({
    message: "Internal server error",
  });
}

type AdminUserRouterResponse = {
  locals: AdminUserRouterResponseLocals;
  status(code: number): AdminUserRouterResponse;
  json(body: unknown): void;
};
