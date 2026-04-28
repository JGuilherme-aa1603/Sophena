import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../../generated/prisma/client.ts";
import { resolveDatabaseUrlForRuntime } from "./database-url.ts";

declare global {
  // eslint-disable-next-line no-var
  var __sophenaPrismaClient__: PrismaClient | undefined;
}

function getRuntimeMode() {
  return process.env.SOPHENA_RUNTIME_MODE === "test" ? "test" : "app";
}

const adapter = new PrismaPg({
  connectionString: resolveDatabaseUrlForRuntime(getRuntimeMode(), process.env),
});

export const prisma =
  globalThis.__sophenaPrismaClient__ ??
  new PrismaClient({
    adapter,
  });

if (!globalThis.__sophenaPrismaClient__) {
  globalThis.__sophenaPrismaClient__ = prisma;
}
