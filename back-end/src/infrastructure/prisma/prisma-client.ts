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

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: resolveDatabaseUrlForRuntime(getRuntimeMode(), process.env),
  });

  return new PrismaClient({
    adapter,
  });
}

export function getPrismaClient() {
  if (!globalThis.__sophenaPrismaClient__) {
    globalThis.__sophenaPrismaClient__ = createPrismaClient();
  }

  return globalThis.__sophenaPrismaClient__;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);

    return typeof value === "function"
      ? value.bind(client)
      : value;
  },
});
