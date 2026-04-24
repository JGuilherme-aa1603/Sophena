import { Router } from "express";

import {
  ResourceNotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../auth/application/auth-errors.ts";
import { requireAuthenticatedUser } from "../../../auth/presentation/http/security-middleware.ts";
import { type AuthenticatedUserView } from "../../../auth/domain/auth-user.ts";
import { listService } from "../../composition/list-module.ts";
import { ListNameConflictError } from "../../application/list-errors.ts";
import { createListItemRouter } from "../../../list-items/presentation/http/list-item-router.ts";

type ListRouteResponseLocals = {
  authenticatedUser?: AuthenticatedUserView;
};

export function createListRouter() {
  const router = Router();

  router.use(requireAuthenticatedUser);
  router.use("/:listId/items", createListItemRouter());

  router.get("/", async (request, response) => {
    try {
      const result = await listService.readLists(
        getAuthenticatedUser(response),
      );

      response.status(200).json(result);
    } catch (error) {
      handleListError(error, response);
    }
  });

  router.post("/", async (request, response) => {
    try {
      const result = await listService.createList(
        getAuthenticatedUser(response),
        request.body ?? {},
      );

      response.status(201).json(result);
    } catch (error) {
      handleListError(error, response);
    }
  });

  router.patch("/:listId", async (request, response) => {
    try {
      const result = await listService.updateListName(
        getAuthenticatedUser(response),
        request.params.listId,
        request.body ?? {},
      );

      response.status(200).json(result);
    } catch (error) {
      handleListError(error, response);
    }
  });

  router.delete("/:listId", async (request, response) => {
    try {
      const result = await listService.deleteList(
        getAuthenticatedUser(response),
        request.params.listId,
      );

      response.status(200).json(result);
    } catch (error) {
      handleListError(error, response);
    }
  });

  return router;
}

function getAuthenticatedUser(response: { locals: ListRouteResponseLocals }) {
  const authenticatedUser = response.locals.authenticatedUser;

  if (!authenticatedUser) {
    throw new UnauthorizedError();
  }

  return authenticatedUser;
}

function handleListError(error: unknown, response: ListRouterResponse) {
  if (error instanceof ValidationError) {
    response.status(400).json({
      message: "Validation failed",
      errors: error.errors,
    });
    return;
  }

  if (error instanceof ListNameConflictError) {
    response.status(409).json({
      message: "List name already exists",
    });
    return;
  }

  if (error instanceof ResourceNotFoundError) {
    response.status(404).json({
      message: "Resource not found",
    });
    return;
  }

  if (error instanceof UnauthorizedError) {
    response.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  response.status(500).json({
    message: "Internal server error",
  });
}

type ListRouterResponse = {
  locals: ListRouteResponseLocals;
  status(code: number): ListRouterResponse;
  json(body: unknown): void;
};
