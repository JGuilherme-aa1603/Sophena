import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../../generated/prisma/client.ts";

declare global {
  // eslint-disable-next-line no-var
  var __sophenaPrismaClient__: PrismaClient | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return databaseUrl;
}

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
});

export const prisma =
  globalThis.__sophenaPrismaClient__ ??
  new PrismaClient({
    adapter,
  });

if (!globalThis.__sophenaPrismaClient__) {
  globalThis.__sophenaPrismaClient__ = prisma;
}
