import { Router, type Request, type Response, type NextFunction } from "express";

import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from "../../../auth/application/auth-errors.ts";
import {
  requireAuthenticatedUser,
} from "../../../auth/presentation/http/security-middleware.ts";
import { type AuthenticatedUserView } from "../../../auth/domain/auth-user.ts";
import { logService } from "../../composition/log-module.ts";

type AdminLogRouterResponseLocals = {
  authenticatedUser?: AuthenticatedUserView;
};

export function createAdminLogRouter() {
  const router = Router();

  router.get(
    "/logs",
    requireAuthenticatedUser,
    requireAdminAccessWithAudit("/admin/logs"),
    async (request, response) => {
      try {
        const result = await logService.readLogs(request.query);
        response.status(200).json(result);
      } catch (error) {
        handleAdminLogError(error, response);
      }
    },
  );

  router.get(
    "/logs/summary",
    requireAuthenticatedUser,
    requireAdminAccessWithAudit("/admin/logs/summary"),
    async (_request, response) => {
      try {
        const result = await logService.summarizeLogs();
        response.status(200).json(result);
      } catch (error) {
        handleAdminLogError(error, response);
      }
    },
  );

  return router;
}

function requireAdminAccessWithAudit(route: "/admin/logs" | "/admin/logs/summary") {
  return async (
    request: Request,
    response: Response<unknown, AdminLogRouterResponseLocals>,
    next: NextFunction,
  ) => {
    const authenticatedUser = response.locals.authenticatedUser;

    if (!authenticatedUser) {
      handleAdminLogError(new UnauthorizedError(), response);
      return;
    }

    if (!authenticatedUser.is_admin) {
      await writeAuditLogSafely({
        level: "WARN",
        status_code: 403,
        message: "Unauthorized admin access",
        route,
        method: request.method as "GET",
        user_id: authenticatedUser.id,
      });

      handleAdminLogError(new ForbiddenError(), response);
      return;
    }

    next();
  };
}

async function writeAuditLogSafely(
  input: Parameters<typeof logService.createLog>[0],
) {
  try {
    await logService.createLog(input);
  } catch {
    // Logging must never change admin authorization responses.
  }
}

function handleAdminLogError(error: unknown, response: AdminLogRouterResponse) {
  if (error instanceof ValidationError) {
    response.status(400).json({
      message: "Validation failed",
      errors: error.errors,
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

type AdminLogRouterResponse = {
  locals: AdminLogRouterResponseLocals;
  status(code: number): AdminLogRouterResponse;
  json(body: unknown): void;
};
