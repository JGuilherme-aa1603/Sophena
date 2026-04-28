import multer from "multer";
import { Router } from "express";

import {
  UnauthorizedError,
  ValidationError,
} from "../../../auth/application/auth-errors.ts";
import { requireAuthenticatedUser } from "../../../auth/presentation/http/security-middleware.ts";
import {
  type BookCoverUploadService as ConcreteBookCoverUploadService,
} from "../../application/book-cover-upload-service.ts";
import {
  getBookCoverUploadService,
  readImageMaxUploadBytes,
} from "../../composition/upload-module.ts";

export type BookCoverUploadService = Pick<ConcreteBookCoverUploadService, "uploadBookCover">;

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function createUploadRouter(input: {
  bookCoverUploadService?: BookCoverUploadService;
} = {}) {
  const router = Router();
  const multipartUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: readImageMaxUploadBytes(),
    },
  });

  router.use(requireAuthenticatedUser);

  router.post("/book-covers", multipartUpload.single("file"), async (request, response) => {
    try {
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

      const result = await (input.bookCoverUploadService ?? getBookCoverUploadService()).uploadBookCover({
        originalFileName: request.file.originalname,
        mimeType: request.file.mimetype,
        bytes: request.file.buffer,
        objectKeyPrefix: "book-covers",
      });

      response.status(201).json(result);
    } catch (error) {
      handleUploadError(error, response);
    }
  });

  return router;
}

function handleUploadError(error: unknown, response: UploadRouterResponse) {
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

type UploadRouterResponse = {
  status(code: number): UploadRouterResponse;
  json(body: unknown): void;
};
