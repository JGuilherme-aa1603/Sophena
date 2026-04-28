import express from "express";
import cors from "cors";
import helmet from "helmet";

import { createAuthRouter } from "./modules/auth/presentation/http/auth-router";
import { createAdminUserRouter } from "./modules/admin/presentation/http/admin-user-router";
import { createBookRouter } from "./modules/books/presentation/http/book-router";
import { createListRouter } from "./modules/lists/presentation/http/list-router";
import { createAdminLogRouter } from "./modules/logs/presentation/http/admin-log-router";
import {
  createUploadRouter,
  type BookCoverUploadService,
} from "./modules/uploads/presentation/http/upload-router";

type AppDependencies = {
  bookCoverUploadService?: BookCoverUploadService;
};

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(createCorsOptions()));
  app.use(express.json());
  app.use("/auth", createAuthRouter());
  app.use("/admin", createAdminUserRouter());
  app.use("/admin", createAdminLogRouter());
  app.use("/books", createBookRouter());
  app.use("/lists", createListRouter());
  app.use("/uploads", createUploadRouter({
    bookCoverUploadService: dependencies.bookCoverUploadService,
  }));

  return app;
}

export const app = createApp();

function createCorsOptions(): cors.CorsOptions {
  const allowedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

  return {
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  };
}
