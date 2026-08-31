import { Router } from "express";

import {
  ResourceNotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../auth/application/auth-errors.ts";
import { type AuthenticatedUserView } from "../../../auth/domain/auth-user.ts";
import {
  BookAlreadyExistsInListError,
  BookAlreadyExistsInTargetListError,
  ListItemPositionConflictError,
} from "../../application/list-item-errors.ts";
import { listItemService } from "../../composition/list-item-module.ts";

type ListItemRouterResponseLocals = {
  authenticatedUser?: AuthenticatedUserView;
};

export function createListItemRouter() {
  const router = Router({
    mergeParams: true,
  });

  router.get("/", async (request, response) => {
    try {
      const result = await listItemService.readListItems(
        getAuthenticatedUser(response),
        readNamedParam(request.params, "listId"),
      );

      response.status(200).json(result);
    } catch (error) {
      handleListItemError(error, response);
    }
  });

  router.post("/", async (request, response) => {
    try {
      const result = await listItemService.createListItem(
        getAuthenticatedUser(response),
        readNamedParam(request.params, "listId"),
        request.body ?? {},
      );

      response.status(201).json(result);
    } catch (error) {
      handleListItemError(error, response);
    }
  });

  router.delete("/:itemId", async (request, response) => {
    try {
      const result = await listItemService.deleteListItem(
        getAuthenticatedUser(response),
        readNamedParam(request.params, "listId"),
        readNamedParam(request.params, "itemId"),
      );

      response.status(200).json(result);
    } catch (error) {
      handleListItemError(error, response);
    }
  });

  router.patch("/:itemId/reorder", async (request, response) => {
    try {
      const result = await listItemService.reorderListItem(
        getAuthenticatedUser(response),
        readNamedParam(request.params, "listId"),
        readNamedParam(request.params, "itemId"),
        request.body ?? {},
      );

      response.status(200).json(result);
    } catch (error) {
      handleListItemError(error, response);
    }
  });

  router.patch("/:itemId/move", async (request, response) => {
    try {
      const result = await listItemService.moveListItem(
        getAuthenticatedUser(response),
        readNamedParam(request.params, "listId"),
        readNamedParam(request.params, "itemId"),
        request.body ?? {},
      );

      response.status(200).json(result);
    } catch (error) {
      handleListItemError(error, response);
    }
  });

  return router;
}

function readNamedParam(
  params: Record<string, string | undefined>,
  key: string,
) {
  return params[key] ?? "";
}

function getAuthenticatedUser(response: { locals: ListItemRouterResponseLocals }) {
  const authenticatedUser = response.locals.authenticatedUser;

  if (!authenticatedUser) {
    throw new UnauthorizedError();
  }

  return authenticatedUser;
}

function handleListItemError(error: unknown, response: ListItemRouterResponse) {
  if (error instanceof ValidationError) {
    response.status(400).json({
      message: "Validation failed",
      errors: error.errors,
    });
    return;
  }

  if (error instanceof BookAlreadyExistsInListError) {
    response.status(409).json({
      message: "Book already exists in list",
    });
    return;
  }

  if (error instanceof BookAlreadyExistsInTargetListError) {
    response.status(409).json({
      message: "Book already exists in target list",
    });
    return;
  }

  if (error instanceof ListItemPositionConflictError) {
    response.status(409).json({
      message: "List item position conflict",
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

  console.error("Unhandled error in list items router.", error);

  response.status(500).json({
    message: "Internal server error",
  });
}

type ListItemRouterResponse = {
  locals: ListItemRouterResponseLocals;
  status(code: number): ListItemRouterResponse;
  json(body: unknown): void;
};
