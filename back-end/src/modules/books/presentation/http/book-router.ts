import { Router } from "express";

import {
  UnauthorizedError,
  ValidationError,
} from "../../../auth/application/auth-errors.ts";
import { requireAuthenticatedUser } from "../../../auth/presentation/http/security-middleware.ts";
import { bookService } from "../../composition/book-module.ts";

export function createBookRouter() {
  const router = Router();

  router.use(requireAuthenticatedUser);

  router.get("/", async (request, response) => {
    try {
      const result = await bookService.readBooks({
        search: request.query.search,
      });

      response.status(200).json(result);
    } catch (error) {
      handleBookError(error, response);
    }
  });

  router.post("/", async (request, response) => {
    try {
      const result = await bookService.createBook(request.body ?? {});

      response.status(201).json(result);
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

  response.status(500).json({
    message: "Internal server error",
  });
}

type BookRouterResponse = {
  status(code: number): BookRouterResponse;
  json(body: unknown): void;
};
