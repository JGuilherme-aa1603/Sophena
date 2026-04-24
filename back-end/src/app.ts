import express from "express";
import cors from "cors";
import helmet from "helmet";

import { createAuthRouter } from "./modules/auth/presentation/http/auth-router";
import { createBookRouter } from "./modules/books/presentation/http/book-router";
import { createListRouter } from "./modules/lists/presentation/http/list-router";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(createCorsOptions()));
  app.use(express.json());
  app.use("/auth", createAuthRouter());
  app.use("/books", createBookRouter());
  app.use("/lists", createListRouter());

  return app;
}

export const app = createApp();

function createCorsOptions(): cors.CorsOptions {
  const allowedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

  return {
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  };
}
