import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Server } from "node:http";

import { createApp } from "../../../src/app.ts";
import {
  createTestUser,
  disconnectDatabase,
  expireRefreshToken,
  findRefreshTokensByUserId,
  resetDatabase,
  sha256,
} from "../support/db-test-helpers.ts";
import {
  requestJson,
  startHttpServer,
  stopHttpServer,
} from "./support/http-test-server.ts";

let server: Server | undefined;

function getRefreshCookie(setCookieHeader: string | null) {
  assert.ok(setCookieHeader);
  const refreshCookie = setCookieHeader
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.startsWith("refresh_token="));

  assert.ok(refreshCookie);
  return refreshCookie.split(";")[0];
}

async function login(credentials: {
  user_name: string;
  password: string;
}) {
  const loginResponse = await requestJson(server!, {
    method: "POST",
    path: "/auth/login",
    body: credentials,
  });

  assert.equal(loginResponse.status, 200);

  return {
    accessToken: loginResponse.body.access_token as string,
    refreshCookie: getRefreshCookie(loginResponse.headers.get("set-cookie")),
  };
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

describe("Auth refresh and logout", () => {
  test("refresh succeeds and returns a new access token with rotated refresh cookie", async () => {
    const user = await createTestUser({
      user_name: "refresh-user",
      password: "RefreshSenha#123",
    });

    const loginResult = await login({
      user_name: "refresh-user",
      password: "RefreshSenha#123",
    });

    const refreshResponse = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: loginResult.refreshCookie,
      },
    });

    assert.equal(refreshResponse.status, 200);
    assert.equal(typeof refreshResponse.body.access_token, "string");
    assert.ok(refreshResponse.body.access_token.length > 0);

    const rotatedCookie = getRefreshCookie(refreshResponse.headers.get("set-cookie"));
    assert.notEqual(rotatedCookie, loginResult.refreshCookie);

    const refreshTokens = await findRefreshTokensByUserId(user.id);
    assert.equal(refreshTokens.length, 2);
    assert.equal(refreshTokens[0].revoked_at instanceof Date, true);
    assert.equal(refreshTokens[1].revoked_at, null);
  });

  test("old refresh token reuse fails after rotation", async () => {
    const user = await createTestUser({
      user_name: "refresh-rotation-user",
      password: "RefreshSenha#456",
    });

    const loginResult = await login({
      user_name: "refresh-rotation-user",
      password: "RefreshSenha#456",
    });

    const firstRefreshResponse = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: loginResult.refreshCookie,
      },
    });

    assert.equal(firstRefreshResponse.status, 200);

    const secondRefreshResponse = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: loginResult.refreshCookie,
      },
    });

    assert.equal(secondRefreshResponse.status, 401);
    assert.equal(secondRefreshResponse.body.message, "Authentication required");

    const refreshTokens = await findRefreshTokensByUserId(user.id);
    assert.equal(refreshTokens.length, 2);
    assert.equal(refreshTokens[0].revoked_at instanceof Date, true);
    assert.equal(refreshTokens[1].revoked_at, null);
  });

  test("logout invalidates the refresh token", async () => {
    const user = await createTestUser({
      user_name: "refresh-logout-user",
      password: "RefreshSenha#789",
    });

    const loginResult = await login({
      user_name: "refresh-logout-user",
      password: "RefreshSenha#789",
    });

    const logoutResponse = await requestJson(server!, {
      method: "POST",
      path: "/auth/logout",
      headers: {
        cookie: loginResult.refreshCookie,
      },
    });

    assert.equal(logoutResponse.status, 200);
    assert.equal(logoutResponse.body.message, "Logout successful");

    const refreshResponse = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: loginResult.refreshCookie,
      },
    });

    assert.equal(refreshResponse.status, 401);
    assert.equal(refreshResponse.body.message, "Authentication required");

    const refreshTokens = await findRefreshTokensByUserId(user.id);
    assert.equal(refreshTokens.length, 1);
    assert.equal(refreshTokens[0].revoked_at instanceof Date, true);
  });

  test("missing refresh token returns 401", async () => {
    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.message, "Authentication required");
  });

  test("invalid refresh token returns 401", async () => {
    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: "refresh_token=token-invalido",
      },
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.message, "Authentication required");
  });

  test("expired refresh token fails even when stored in database", async () => {
    await createTestUser({
      user_name: "refresh-expired-user",
      password: "RefreshSenha#999",
    });

    const loginResult = await login({
      user_name: "refresh-expired-user",
      password: "RefreshSenha#999",
    });

    const rawRefreshToken = loginResult.refreshCookie.slice("refresh_token=".length);
    await expireRefreshToken(rawRefreshToken);

    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: loginResult.refreshCookie,
      },
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.message, "Authentication required");
  });

  test("refresh tokens persist through a new app instance using the same database", async () => {
    await createTestUser({
      user_name: "refresh-persist-user",
      password: "RefreshSenha#321",
    });

    const loginResult = await login({
      user_name: "refresh-persist-user",
      password: "RefreshSenha#321",
    });

    await stopHttpServer(server!);
    server = await startHttpServer(createApp());

    const refreshResponse = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: loginResult.refreshCookie,
      },
    });

    assert.equal(refreshResponse.status, 200);
    assert.equal(typeof refreshResponse.body.access_token, "string");
  });

  test("database stores only the refresh token hash", async () => {
    const user = await createTestUser({
      user_name: "refresh-hash-user",
      password: "RefreshSenha#654",
    });

    const loginResult = await login({
      user_name: "refresh-hash-user",
      password: "RefreshSenha#654",
    });

    const rawRefreshToken = loginResult.refreshCookie.slice("refresh_token=".length);
    const refreshTokens = await findRefreshTokensByUserId(user.id);

    assert.equal(refreshTokens.length, 1);
    assert.equal(refreshTokens[0].token_hash, sha256(rawRefreshToken));
    assert.notEqual(refreshTokens[0].token_hash, rawRefreshToken);
  });
});
