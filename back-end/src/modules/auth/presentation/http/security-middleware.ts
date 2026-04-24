import type { NextFunction, Request, Response } from "express";

import {
  ForbiddenError,
  ResourceNotFoundError,
  UnauthorizedError,
} from "../../application/auth-errors.ts";
import { authContextService } from "../../composition/auth-module.ts";
import { type AuthenticatedUserView } from "../../domain/auth-user.ts";

type AuthenticatedLocals = {
  authenticatedUser?: AuthenticatedUserView;
};

export async function requireAuthenticatedUser(
  request: Request,
  response: Response<unknown, AuthenticatedLocals>,
  next: NextFunction,
) {
  try {
    const authenticatedUser = await authContextService.authenticate(
      request.header("authorization") ?? undefined,
    );

    response.locals.authenticatedUser = authenticatedUser;
    next();
  } catch (error) {
    handleSecurityError(error, response);
  }
}

export function requireAdminUser(
  _request: Request,
  response: Response<unknown, AuthenticatedLocals>,
  next: NextFunction,
) {
  try {
    const authenticatedUser = response.locals.authenticatedUser;

    if (!authenticatedUser) {
      throw new UnauthorizedError();
    }

    authContextService.ensureAdmin(authenticatedUser);
    next();
  } catch (error) {
    handleSecurityError(error, response);
  }
}

export function requireUserOwnership(paramName: string) {
  return (
    request: Request,
    response: Response<unknown, AuthenticatedLocals>,
    next: NextFunction,
  ) => {
    try {
      const authenticatedUser = response.locals.authenticatedUser;

      if (!authenticatedUser) {
        throw new UnauthorizedError();
      }

      authContextService.ensureOwnership(
        authenticatedUser,
        readRouteParamAsString(request.params[paramName]),
      );
      next();
    } catch (error) {
      handleSecurityError(error, response);
    }
  };
}

function readRouteParamAsString(param: unknown) {
  return typeof param === "string" ? param : undefined;
}

function handleSecurityError(
  error: unknown,
  response: Response,
) {
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
