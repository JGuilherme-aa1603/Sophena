import "dotenv/config";

import { createApp } from "./app";

function readPort() {
  const rawPort = process.env.PORT;

  if (!rawPort) {
    return 3000;
  }

  const parsedPort = Number(rawPort);

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  return parsedPort;
}

const port = readPort();
const app = createApp();
const server = app.listen(port, () => {
  console.log(`Sophena API running on port ${port}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down Sophena API.`);

  server.close((error) => {
    if (error) {
      console.error("Failed to close Sophena API cleanly.", error);
      process.exit(1);
      return;
    }

    process.exit(0);
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
