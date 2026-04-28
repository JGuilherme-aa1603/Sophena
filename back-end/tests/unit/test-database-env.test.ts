import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  resolveDatabaseUrlForRuntime,
  type RuntimeMode,
} from "../../src/infrastructure/prisma/database-url.ts";

function readDatabaseUrl(mode: RuntimeMode, env: NodeJS.ProcessEnv) {
  return resolveDatabaseUrlForRuntime(mode, env);
}

describe("test database env", () => {
  test("uses DATABASE_URL in app runtime", () => {
    const databaseUrl = readDatabaseUrl("app", {
      DATABASE_URL: "postgresql://prod-user:secret@db/prod",
    });

    assert.equal(databaseUrl, "postgresql://prod-user:secret@db/prod");
  });

  test("fails in test runtime when DATABASE_URL_TEST is missing", () => {
    assert.throws(
      () =>
        readDatabaseUrl("test", {
          DATABASE_URL: "postgresql://prod-user:secret@db/prod",
        }),
      /DATABASE_URL_TEST is required for automated tests/,
    );
  });

  test("fails in test runtime when DATABASE_URL_TEST matches DATABASE_URL", () => {
    assert.throws(
      () =>
        readDatabaseUrl("test", {
          DATABASE_URL: "postgresql://shared-user:secret@db/shared",
          DATABASE_URL_TEST: "postgresql://shared-user:secret@db/shared",
        }),
      /DATABASE_URL_TEST must be different from DATABASE_URL/,
    );
  });

  test("uses DATABASE_URL_TEST in test runtime when isolated", () => {
    const databaseUrl = readDatabaseUrl("test", {
      DATABASE_URL: "postgresql://prod-user:secret@db/prod",
      DATABASE_URL_TEST: "postgresql://test-user:secret@db/test",
    });

    assert.equal(databaseUrl, "postgresql://test-user:secret@db/test");
  });
});
