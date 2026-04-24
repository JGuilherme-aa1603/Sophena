import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Server } from "node:http";

import { createApp } from "../../../src/app.ts";
import {
  createTestUser,
  disconnectDatabase,
  resetDatabase,
} from "../support/db-test-helpers.ts";
import {
  requestJson,
  startHttpServer,
  stopHttpServer,
} from "./support/http-test-server.ts";

let server: Server | undefined;

beforeEach(async () => {
  await resetDatabase();
  server = await startHttpServer(createApp());
});

afterEach(async () => {
  if (server) {
    await stopHttpServer(server);
    server = undefined;
  }
});

afterEach(async () => {
  await disconnectDatabase();
});

describe("POST /auth/login", () => {
  test("authenticates a non-admin user, returns an access token, and sets a secure refresh cookie", async () => {
    const user = await createTestUser({
      user_name: "leitora-normal",
      password: "SenhaForte#123",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/login",
      body: {
        user_name: "leitora-normal",
        password: "SenhaForte#123",
      },
    });

    assert.equal(response.status, 200);
    assert.equal(typeof response.body?.access_token, "string");
    assert.ok(response.body.access_token.length > 0);
    assert.equal(response.body.user.user_name, "leitora-normal");
    assert.equal(response.body.user.is_admin, false);
    assert.equal(response.body.user.id, user.id);
    assert.equal("refresh_token" in response.body, false);

    const setCookieHeader = response.headers.get("set-cookie");
    assert.ok(setCookieHeader);
    assert.match(setCookieHeader, /HttpOnly/i);
    assert.match(setCookieHeader, /Secure/i);
    assert.match(setCookieHeader, /SameSite=Strict/i);
  });

  test("authenticates an admin user and returns is_admin=true in the response body", async () => {
    const adminUser = await createTestUser({
      user_name: "admin-root",
      password: "AdminSenha#123",
      is_admin: true,
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/login",
      body: {
        user_name: "admin-root",
        password: "AdminSenha#123",
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.user.user_name, "admin-root");
    assert.equal(response.body.user.is_admin, true);
    assert.equal(response.body.user.id, adminUser.id);
  });

  test("rejects login with an unknown user using a safe 401 response", async () => {
    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/login",
      body: {
        user_name: "desconhecido",
        password: "SenhaInvalida#123",
      },
    });

    assert.equal(response.status, 401);
    assert.equal(typeof response.body?.message, "string");
    assert.ok(response.body.message.length > 0);
    assert.doesNotMatch(response.body.message, /desconhecido/i);
    assert.equal("access_token" in response.body, false);
    assert.equal(response.headers.get("set-cookie"), null);
  });

  test("rejects login with a wrong password using the same safe 401 response", async () => {
    await createTestUser({
      user_name: "leitora-com-senha",
      password: "SenhaCorreta#123",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/login",
      body: {
        user_name: "leitora-com-senha",
        password: "SenhaErrada#123",
      },
    });

    assert.equal(response.status, 401);
    assert.equal(typeof response.body?.message, "string");
    assert.ok(response.body.message.length > 0);
    assert.doesNotMatch(response.body.message, /leitora-com-senha/i);
    assert.equal("access_token" in response.body, false);
    assert.equal(response.headers.get("set-cookie"), null);
  });

  for (const invalidCase of [
    {
      name: "missing user_name",
      body: { password: "SenhaForte#123" },
      expectedFields: ["user_name"],
    },
    {
      name: "missing password",
      body: { user_name: "leitora-sem-senha" },
      expectedFields: ["password"],
    },
    {
      name: "missing both required fields",
      body: {},
      expectedFields: ["password", "user_name"],
    },
  ] as const) {
    test(`returns 400 with field-level validation details when ${invalidCase.name}`, async () => {
      const response = await requestJson(server!, {
        method: "POST",
        path: "/auth/login",
        body: invalidCase.body,
      });

      assert.equal(response.status, 400);
      assert.equal(response.body?.message, "Validation failed");
      assert.ok(Array.isArray(response.body?.errors));

      const errorFields = response.body.errors.map((error: { field: string }) => error.field).sort();
      assert.deepEqual(errorFields, [...invalidCase.expectedFields].sort());
      assert.equal("access_token" in response.body, false);
      assert.equal(response.headers.get("set-cookie"), null);
    });
  }

  test("returns 400 when login fields are present with invalid primitive types", async () => {
    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/login",
      body: {
        user_name: 12345,
        password: true,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.ok(Array.isArray(response.body?.errors));

    const errorFields = response.body.errors.map((error: { field: string }) => error.field).sort();
    assert.deepEqual(errorFields, ["password", "user_name"]);
  });

  test("returns 400 when login fields are empty after trim", async () => {
    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/login",
      body: {
        user_name: "   ",
        password: "   ",
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.ok(Array.isArray(response.body?.errors));

    const errorFields = response.body.errors.map((error: { field: string }) => error.field).sort();
    assert.deepEqual(errorFields, ["password", "user_name"]);
  });
});
