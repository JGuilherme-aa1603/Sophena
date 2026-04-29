import { Router } from "express";

import {
  UnauthorizedError,
  ValidationError,
  ForbiddenError,
  ResourceNotFoundError,
} from "../../../auth/application/auth-errors.ts";
import {
  requireAdminUser,
  requireAuthenticatedUser,
} from "../../../auth/presentation/http/security-middleware.ts";
import { BookDeletionConfirmationRequiredError } from "../../application/book-errors.ts";
import { type BookService } from "../../application/book-service.ts";
import { bookService } from "../../composition/book-module.ts";

export function createBookRouter(currentBookService: BookService = bookService) {
  const router = Router();

  router.use(requireAuthenticatedUser);

  router.get("/", async (request, response) => {
    try {
      const result = await currentBookService.readBooks({
        search: request.query.search,
        author: request.query.author,
        cover: request.query.cover,
      });

      response.status(200).json(result);
    } catch (error) {
      handleBookError(error, response);
    }
  });

  router.post("/", async (request, response) => {
    try {
      const result = await currentBookService.createBook(request.body ?? {});

      response.status(201).json(result);
    } catch (error) {
      handleBookError(error, response);
    }
  });

  router.delete("/:bookId", requireAdminUser, async (request, response) => {
    try {
      const result = await currentBookService.deleteBook({
        bookId: request.params.bookId,
        force: request.query.force,
      });

      response.status(200).json({
        id: request.params.bookId,
        removed_from_lists_count: result.removed_from_lists_count,
      });
    } catch (error) {
      handleBookError(error, response);
    }
  });

  return router;
}

function handleBookError(error: unknown, response: BookRouterResponse) {
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

  if (error instanceof ResourceNotFoundError) {
    response.status(404).json({
      message: "Resource not found",
    });
    return;
  }

  if (error instanceof BookDeletionConfirmationRequiredError) {
    response.status(409).json({
      message: "Book is still used in lists",
      requires_confirmation: true,
      removed_from_lists_count: error.removedFromListsCount,
    });
    return;
  }

  response.status(500).json({
    message: "Internal server error",
  });
}

type BookRouterResponse = {
  status(code: number): BookRouterResponse;
  json(body: unknown): void;
};
