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
} from "../auth/support/http-test-server.ts";

let server: Server | undefined;
const previousCorsOrigin = process.env.CORS_ORIGIN;
const previousRateLimitWindowMs = process.env.AUTH_RATE_LIMIT_WINDOW_MS;
const previousLoginRateLimitMax = process.env.AUTH_LOGIN_RATE_LIMIT_MAX;
const previousRefreshRateLimitMax = process.env.AUTH_REFRESH_RATE_LIMIT_MAX;
const previousNodeEnv = process.env.NODE_ENV;
const previousTrustProxy = process.env.TRUST_PROXY;

async function login(credentials: {
  user_name: string;
  password: string;
}) {
  return requestJson(server!, {
    method: "POST",
    path: "/auth/login",
    body: credentials,
  });
}

beforeEach(async () => {
  process.env.CORS_ORIGIN = "http://localhost:5173";
  process.env.AUTH_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.AUTH_LOGIN_RATE_LIMIT_MAX = "2";
  process.env.AUTH_REFRESH_RATE_LIMIT_MAX = "2";
  process.env.NODE_ENV = "test";
  delete process.env.TRUST_PROXY;

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
  restoreEnv("CORS_ORIGIN", previousCorsOrigin);
  restoreEnv("AUTH_RATE_LIMIT_WINDOW_MS", previousRateLimitWindowMs);
  restoreEnv("AUTH_LOGIN_RATE_LIMIT_MAX", previousLoginRateLimitMax);
  restoreEnv("AUTH_REFRESH_RATE_LIMIT_MAX", previousRefreshRateLimitMax);
  restoreEnv("NODE_ENV", previousNodeEnv);
  restoreEnv("TRUST_PROXY", previousTrustProxy);
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

describe("HTTP hardening", () => {
  test("disables x-powered-by and sets helmet security headers", async () => {
    const response = await requestJson(server!, {
      method: "GET",
      path: "/auth/me",
    });

    assert.equal(response.headers.get("x-powered-by"), null);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
    assert.ok(response.headers.get("content-security-policy"));
  });

  test("applies explicit CORS configuration", async () => {
    const response = await requestJson(server!, {
      method: "OPTIONS",
      path: "/auth/login",
      headers: {
        origin: "http://localhost:5173",
        "access-control-request-method": "POST",
      },
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.ok(response.headers.get("access-control-allow-methods")?.includes("POST"));
  });

  test("trusts one proxy in production so hosted rate limiting can read forwarded IPs", () => {
    process.env.NODE_ENV = "production";
    delete process.env.TRUST_PROXY;

    const app = createApp();

    assert.equal(app.get("trust proxy"), 1);
  });

  test("does not trust proxies by default outside production", () => {
    process.env.NODE_ENV = "test";
    delete process.env.TRUST_PROXY;

    const app = createApp();

    assert.equal(app.get("trust proxy"), false);
  });

  test("allows the trust proxy value to be configured by environment", () => {
    process.env.NODE_ENV = "test";
    process.env.TRUST_PROXY = "2";

    const app = createApp();

    assert.equal(app.get("trust proxy"), 2);
  });

  test("rate limits repeated login attempts", async () => {
    const firstResponse = await login({
      user_name: "nao-existe",
      password: "SenhaInvalida#1",
    });
    const secondResponse = await login({
      user_name: "nao-existe",
      password: "SenhaInvalida#1",
    });
    const thirdResponse = await login({
      user_name: "nao-existe",
      password: "SenhaInvalida#1",
    });

    assert.equal(firstResponse.status, 401);
    assert.equal(secondResponse.status, 401);
    assert.equal(thirdResponse.status, 429);
    assert.equal(thirdResponse.body?.message, "Too many requests");
  });

  test("rate limits repeated refresh attempts", async () => {
    await createTestUser({
      user_name: "refresh-hardening-user",
      password: "RefreshHardening#123",
    });

    const loginResponse = await login({
      user_name: "refresh-hardening-user",
      password: "RefreshHardening#123",
    });

    assert.equal(loginResponse.status, 200);

    const firstRefresh = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: "refresh_token=token-invalido",
      },
    });
    const secondRefresh = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: "refresh_token=token-invalido",
      },
    });
    const thirdRefresh = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: "refresh_token=token-invalido",
      },
    });

    assert.equal(firstRefresh.status, 401);
    assert.equal(secondRefresh.status, 401);
    assert.equal(thirdRefresh.status, 429);
    assert.equal(thirdRefresh.body?.message, "Too many requests");
  });
});
