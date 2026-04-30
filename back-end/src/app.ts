import express from "express";
import cors from "cors";
import helmet from "helmet";

import { createAuthRouter } from "./modules/auth/presentation/http/auth-router";
import {
  createUserPictureService,
  type UserPictureImageProcessor,
  type UserPictureStorage,
} from "./modules/auth/composition/auth-module";
import { createAdminUserRouter } from "./modules/admin/presentation/http/admin-user-router";
import { createBookRouter } from "./modules/books/presentation/http/book-router";
import { createListRouter } from "./modules/lists/presentation/http/list-router";
import { createAdminLogRouter } from "./modules/logs/presentation/http/admin-log-router";
import {
  createUploadRouter,
  type BookCoverUploadService,
} from "./modules/uploads/presentation/http/upload-router";
import { createBookService } from "./modules/books/composition/book-module";
import type { BookCoverStorage } from "./modules/books/application/book-service.ts";

type AppDependencies = {
  bookCoverUploadService?: BookCoverUploadService;
  bookCoverStorage?: BookCoverStorage;
  userPictureImageProcessor?: UserPictureImageProcessor;
  userPictureStorage?: UserPictureStorage;
};

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();

  configureTrustProxy(app);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(createCorsOptions()));
  app.use(express.json());
  app.use("/auth", createAuthRouter(createAuthRouterDependencies(dependencies)));
  app.use("/admin", createAdminUserRouter());
  app.use("/admin", createAdminLogRouter());
  app.use("/books", createBookRouter(createBookService({
    bookCoverStorage: dependencies.bookCoverStorage,
  })));
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

function configureTrustProxy(app: express.Express) {
  const trustProxy = readTrustProxySetting();

  if (trustProxy !== undefined) {
    app.set("trust proxy", trustProxy);
  }
}

function readTrustProxySetting() {
  const configuredValue = process.env.TRUST_PROXY?.trim();

  if (!configuredValue) {
    return process.env.NODE_ENV === "production" ? 1 : undefined;
  }

  if (configuredValue === "true") {
    return true;
  }

  if (configuredValue === "false") {
    return false;
  }

  const numericValue = Number(configuredValue);

  if (Number.isInteger(numericValue) && numericValue >= 0) {
    return numericValue;
  }

  return configuredValue;
}

function createAuthRouterDependencies(dependencies: AppDependencies) {
  if (!dependencies.userPictureImageProcessor && !dependencies.userPictureStorage) {
    return {};
  }

  return {
    userPictureService: createUserPictureService({
      userPictureImageProcessor: dependencies.userPictureImageProcessor,
      userPictureStorage: dependencies.userPictureStorage,
    }),
  };
}
