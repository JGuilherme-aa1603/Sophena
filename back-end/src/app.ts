import express from "express";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.post("/auth/login", (_request, response) => {
    response.status(501).json({
      message: "Not implemented",
    });
  });

  app.get("/auth/me", (_request, response) => {
    response.status(501).json({
      message: "Not implemented",
    });
  });

  return app;
}

export const app = createApp();
