import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Server } from "node:http";

import { app } from "../../../src/app.ts";
import {
  requestJson,
  startHttpServer,
  stopHttpServer,
} from "./support/http-test-server.ts";

let server: Server | undefined;

beforeEach(async () => {
  server = await startHttpServer(app);
});

afterEach(async () => {
  if (server) {
    await stopHttpServer(server);
    server = undefined;
  }
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
    const response = await requestJson(server!, {
      method: "GET",
      path: "/auth/me",
      headers: {
        authorization: "Bearer token-acesso-valido-usuario",
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.user_name, "leitora-autenticada");
    assert.equal(response.body.is_admin, false);
    assert.equal(typeof response.body.id, "string");
    assert.ok(response.body.id.length > 0);
    assert.equal("password_hash" in response.body, false);
  });

  test("returns the authenticated admin user with is_admin=true", async () => {
    const response = await requestJson(server!, {
      method: "GET",
      path: "/auth/me",
      headers: {
        authorization: "Bearer token-acesso-valido-admin",
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.user_name, "admin-autenticado");
    assert.equal(response.body.is_admin, true);
    assert.equal(typeof response.body.id, "string");
  });
});
