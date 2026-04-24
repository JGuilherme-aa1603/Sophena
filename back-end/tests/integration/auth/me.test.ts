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

async function loginAndGetAccessToken(credentials: {
  user_name: string;
  password: string;
}) {
  const loginResponse = await requestJson(server!, {
    method: "POST",
    path: "/auth/login",
    body: credentials,
  });

  assert.equal(loginResponse.status, 200);
  assert.equal(typeof loginResponse.body?.access_token, "string");
  return loginResponse.body.access_token as string;
}

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

describe("GET /auth/me", () => {
  test("returns 401 when the request has no access token", async () => {
    const response = await requestJson(server!, {
      method: "GET",
      path: "/auth/me",
    });

    assert.equal(response.status, 401);
    assert.equal(typeof response.body?.message, "string");
    assert.ok(response.body.message.length > 0);
  });

  test("returns 401 when the request has an invalid access token", async () => {
    const response = await requestJson(server!, {
      method: "GET",
      path: "/auth/me",
      headers: {
        authorization: "Bearer token-invalido",
      },
    });

    assert.equal(response.status, 401);
    assert.equal(typeof response.body?.message, "string");
    assert.ok(response.body.message.length > 0);
  });

  test("returns the authenticated non-admin user without exposing sensitive fields", async () => {
    const user = await createTestUser({
      user_name: "leitora-autenticada",
      password: "SenhaSegura#456",
    });
    const accessToken = await loginAndGetAccessToken({
      user_name: "leitora-autenticada",
      password: "SenhaSegura#456",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/auth/me",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.user_name, "leitora-autenticada");
    assert.equal(response.body.is_admin, false);
    assert.equal(response.body.id, user.id);
    assert.equal("password_hash" in response.body, false);
  });

  test("returns the authenticated admin user with is_admin=true", async () => {
    const adminUser = await createTestUser({
      user_name: "admin-autenticado",
      password: "AdminSenha#456",
      is_admin: true,
    });
    const accessToken = await loginAndGetAccessToken({
      user_name: "admin-autenticado",
      password: "AdminSenha#456",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/auth/me",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.user_name, "admin-autenticado");
    assert.equal(response.body.is_admin, true);
    assert.equal(response.body.id, adminUser.id);
  });
});
