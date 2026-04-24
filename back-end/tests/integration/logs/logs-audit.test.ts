import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Server } from "node:http";

import { createApp } from "../../../src/app.ts";
import { logService } from "../../../src/modules/logs/composition/log-module.ts";
import {
  clearLogs,
  createTestLog,
  createTestUser,
  disconnectDatabase,
  findLogs,
  resetDatabase,
} from "../support/db-test-helpers.ts";
import {
  requestJson,
  startHttpServer,
  stopHttpServer,
} from "../auth/support/http-test-server.ts";

let server: Server | undefined;
const originalCreateLog = logService.createLog.bind(logService);

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
  const response = await requestJson(server!, {
    method: "POST",
    path: "/auth/login",
    body: credentials,
  });

  return {
    status: response.status,
    body: response.body,
    refreshCookie: getRefreshCookie(response.headers.get("set-cookie")),
  };
}

async function loginAs(credentials: {
  user_name: string;
  password: string;
}) {
  const loginResponse = await requestJson(server!, {
    method: "POST",
    path: "/auth/login",
    body: credentials,
  });

  assert.equal(loginResponse.status, 200);
  return `Bearer ${loginResponse.body.access_token as string}`;
}

async function createAdminAccessToken(input: {
  user_name: string;
  password: string;
}) {
  await createTestUser({
    user_name: input.user_name,
    password: input.password,
    is_admin: true,
  });

  return loginAs(input);
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
  logService.createLog = originalCreateLog;
});

afterEach(async () => {
  await disconnectDatabase();
});

describe("Log event emission", () => {
  test("successful login creates INFO log", async () => {
    const user = await createTestUser({
      user_name: "log-login-info-user",
      password: "LogSenha#123",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/login",
      body: {
        user_name: "log-login-info-user",
        password: "LogSenha#123",
      },
    });

    assert.equal(response.status, 200);

    const logs = await findLogs({
      route: "/auth/login",
      method: "POST",
      level: "INFO",
      user_id: user.id,
    });

    assert.equal(logs.length, 1);
    assert.equal(logs[0].status_code, 200);
    assert.equal(logs[0].route, "/auth/login");
    assert.equal(logs[0].method, "POST");
    assert.doesNotMatch(logs[0].message ?? "", /password_hash/i);
    assert.doesNotMatch(logs[0].message ?? "", /refresh_token/i);
  });

  test("failed login creates WARN log", async () => {
    await createTestUser({
      user_name: "log-login-warn-user",
      password: "LogSenha#124",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/login",
      body: {
        user_name: "log-login-warn-user",
        password: "SenhaErrada#124",
      },
    });

    assert.equal(response.status, 401);

    const logs = await findLogs({
      route: "/auth/login",
      method: "POST",
      level: "WARN",
    });

    assert.equal(logs.length, 1);
    assert.equal(logs[0].status_code, 401);
    assert.doesNotMatch(logs[0].message ?? "", /password_hash/i);
    assert.doesNotMatch(logs[0].message ?? "", /refresh_token/i);
  });

  test("invalid refresh creates WARN log", async () => {
    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: "refresh_token=refresh-token-invalido",
      },
    });

    assert.equal(response.status, 401);

    const logs = await findLogs({
      route: "/auth/refresh",
      method: "POST",
      level: "WARN",
    });

    assert.equal(logs.length, 1);
    assert.equal(logs[0].status_code, 401);
    assert.doesNotMatch(logs[0].message ?? "", /refresh-token-invalido/i);
    assert.doesNotMatch(logs[0].message ?? "", /refresh_token/i);
  });

  test("logout creates INFO log", async () => {
    const user = await createTestUser({
      user_name: "log-logout-user",
      password: "LogSenha#125",
    });
    const loginResult = await login({
      user_name: "log-logout-user",
      password: "LogSenha#125",
    });

    assert.equal(loginResult.status, 200);

    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/logout",
      headers: {
        cookie: loginResult.refreshCookie,
      },
    });

    assert.equal(response.status, 200);

    const logs = await findLogs({
      route: "/auth/logout",
      method: "POST",
      level: "INFO",
      user_id: user.id,
    });

    assert.equal(logs.length, 1);
    assert.equal(logs[0].status_code, 200);
    assert.doesNotMatch(logs[0].message ?? "", /refresh_token/i);
  });

  test("unauthorized admin access creates WARN log", async () => {
    await createTestUser({
      user_name: "log-non-admin-user",
      password: "LogSenha#126",
    });
    const userToken = await loginAs({
      user_name: "log-non-admin-user",
      password: "LogSenha#126",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs",
      headers: {
        authorization: userToken,
      },
    });

    assert.equal(response.status, 403);

    const logs = await findLogs({
      route: "/admin/logs",
      method: "GET",
      level: "WARN",
    });

    assert.equal(logs.length, 1);
    assert.equal(logs[0].status_code, 403);
  });

  test("logs never expose password_hash or raw refresh tokens", async () => {
    await createTestUser({
      user_name: "log-sensitive-user",
      password: "LogSenha#132",
    });

    await requestJson(server!, {
      method: "POST",
      path: "/auth/login",
      body: {
        user_name: "log-sensitive-user",
        password: "LogSenha#132",
      },
    });

    await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: "refresh_token=token-sensivel-que-nao-pode-aparecer",
      },
    });

    const logs = await findLogs();

    assert.ok(logs.length >= 2);
    for (const log of logs) {
      assert.doesNotMatch(log.message ?? "", /password_hash/i);
      assert.doesNotMatch(log.message ?? "", /token-sensivel-que-nao-pode-aparecer/i);
      assert.doesNotMatch(log.message ?? "", /refresh_token=/i);
    }
  });

  test("login still returns 200 if INFO logging fails", async () => {
    await createTestUser({
      user_name: "log-login-best-effort-user",
      password: "LogSenha#133",
    });
    logService.createLog = async () => {
      throw new Error("log write failed");
    };

    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/login",
      body: {
        user_name: "log-login-best-effort-user",
        password: "LogSenha#133",
      },
    });

    assert.equal(response.status, 200);
    assert.equal(typeof response.body?.access_token, "string");
  });

  test("invalid refresh still returns 401 if WARN logging fails", async () => {
    logService.createLog = async () => {
      throw new Error("log write failed");
    };

    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/refresh",
      headers: {
        cookie: "refresh_token=refresh-token-invalido",
      },
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("logout still returns 200 if INFO logging fails", async () => {
    await createTestUser({
      user_name: "log-logout-best-effort-user",
      password: "LogSenha#134",
    });
    const loginResult = await login({
      user_name: "log-logout-best-effort-user",
      password: "LogSenha#134",
    });
    assert.equal(loginResult.status, 200);

    logService.createLog = async () => {
      throw new Error("log write failed");
    };

    const response = await requestJson(server!, {
      method: "POST",
      path: "/auth/logout",
      headers: {
        cookie: loginResult.refreshCookie,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body?.message, "Logout successful");
  });

  test("unauthorized admin access still returns 403 if WARN logging fails", async () => {
    await createTestUser({
      user_name: "log-best-effort-non-admin",
      password: "LogSenha#135",
    });
    const userToken = await loginAs({
      user_name: "log-best-effort-non-admin",
      password: "LogSenha#135",
    });
    logService.createLog = async () => {
      throw new Error("log write failed");
    };

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs",
      headers: {
        authorization: userToken,
      },
    });

    assert.equal(response.status, 403);
    assert.equal(response.body?.message, "Forbidden");
  });
});

describe("Log query endpoints", () => {
  test("GET /admin/logs requires authentication", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-auth-admin",
      password: "LogSenha#200",
    });
    await createTestLog({
      level: "INFO",
      status_code: 200,
      message: "Log existente para rota real",
      route: "/auth/login",
      method: "POST",
    });

    const adminResponse = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(adminResponse.status, 200);
    assert.ok(Array.isArray(adminResponse.body?.items));

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs",
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("GET /admin/logs requires admin permission", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-list-real-admin",
      password: "LogSenha#201",
    });
    await createTestLog({
      level: "INFO",
      status_code: 200,
      message: "Log para checar rota real protegida",
      route: "/auth/login",
      method: "POST",
    });

    const adminResponse = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(adminResponse.status, 200);
    assert.ok(Array.isArray(adminResponse.body?.items));

    await createTestUser({
      user_name: "log-list-non-admin",
      password: "LogSenha#127",
    });
    const userToken = await loginAs({
      user_name: "log-list-non-admin",
      password: "LogSenha#127",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs",
      headers: {
        authorization: userToken,
      },
    });

    assert.equal(response.status, 403);
    assert.equal(response.body?.message, "Forbidden");
  });

  test("GET /admin/logs returns paginated logs", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-admin-pagination",
      password: "LogSenha#128",
    });
    await clearLogs();

    await createTestLog({
      level: "INFO",
      status_code: 200,
      message: "Primeiro log",
      route: "/auth/login",
      method: "POST",
      created_at: new Date("2026-04-20T10:00:00.000Z"),
    });
    await createTestLog({
      level: "WARN",
      status_code: 401,
      message: "Segundo log",
      route: "/auth/refresh",
      method: "POST",
      created_at: new Date("2026-04-20T11:00:00.000Z"),
    });
    await createTestLog({
      level: "ERROR",
      status_code: 500,
      message: "Terceiro log",
      route: "/admin/logs",
      method: "GET",
      created_at: new Date("2026-04-20T12:00:00.000Z"),
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?page=1&limit=2",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body?.items));
    assert.equal(response.body.items.length, 2);
    assert.deepEqual(
      response.body.items.map((item: { message: string }) => item.message),
      ["Terceiro log", "Segundo log"],
    );
    assert.deepEqual(response.body.pagination, {
      page: 1,
      limit: 2,
      total: 3,
    });
    for (const item of response.body.items as Array<Record<string, unknown>>) {
      assert.deepEqual(Object.keys(item).sort(), [
        "created_at",
        "id",
        "level",
        "message",
        "method",
        "route",
        "status_code",
        "user_id",
      ]);
      assert.equal("password_hash" in item, false);
      assert.doesNotMatch(String(item.message ?? ""), /refresh_token/i);
    }
  });

  test("GET /admin/logs returns validation error for invalid page", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-invalid-page-admin",
      password: "LogSenha#202",
    });
    await clearLogs();

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?page=0",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["page"]);
  });

  test("GET /admin/logs returns validation error for invalid limit", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-invalid-limit-admin",
      password: "LogSenha#203",
    });
    await clearLogs();

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?limit=0",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["limit"]);
  });

  test("GET /admin/logs returns validation error for limit above maximum", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-invalid-max-limit-admin",
      password: "LogSenha#211",
    });
    await clearLogs();

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?limit=101",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["limit"]);
  });

  test("GET /admin/logs returns validation error for invalid level", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-invalid-level-admin",
      password: "LogSenha#204",
    });
    await clearLogs();

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?level=DEBUG",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["level"]);
  });

  test("GET /admin/logs returns validation error for invalid method", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-invalid-method-admin",
      password: "LogSenha#205",
    });
    await clearLogs();

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?method=TRACE",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["method"]);
  });

  test("GET /admin/logs returns validation error for malformed from date", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-invalid-from-admin",
      password: "LogSenha#206",
    });
    await clearLogs();

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?from=data-invalida",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["from"]);
  });

  test("GET /admin/logs returns validation error for non-ISO from date", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-invalid-from-format-admin",
      password: "LogSenha#212",
    });
    await clearLogs();

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?from=2026-04-20",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["from"]);
  });

  test("GET /admin/logs returns validation error for malformed to date", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-invalid-to-admin",
      password: "LogSenha#207",
    });
    await clearLogs();

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?to=data-invalida",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["to"]);
  });

  test("GET /admin/logs returns validation error when from is greater than to", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-invalid-range-admin",
      password: "LogSenha#208",
    });
    await clearLogs();

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?from=2026-04-22T00:00:00.000Z&to=2026-04-20T00:00:00.000Z",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["from", "to"]);
  });

  test("GET /admin/logs supports filters by level, method, status_code, and date range", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-admin-filters",
      password: "LogSenha#129",
    });
    await clearLogs();

    await createTestLog({
      level: "INFO",
      status_code: 200,
      message: "Fora do filtro",
      route: "/auth/login",
      method: "POST",
      created_at: new Date("2026-04-18T10:00:00.000Z"),
    });
    await createTestLog({
      level: "WARN",
      status_code: 401,
      message: "Dentro do filtro",
      route: "/admin/logs",
      method: "GET",
      created_at: new Date("2026-04-21T10:00:00.000Z"),
    });
    await createTestLog({
      level: "WARN",
      status_code: 403,
      message: "Status diferente",
      route: "/admin/logs",
      method: "GET",
      created_at: new Date("2026-04-21T11:00:00.000Z"),
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?level=WARN&method=GET&status_code=401&from=2026-04-20T00:00:00.000Z&to=2026-04-22T00:00:00.000Z",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body?.items));
    assert.equal(response.body.items.length, 1);
    assert.equal(response.body.items[0].level, "WARN");
    assert.equal(response.body.items[0].method, "GET");
    assert.equal(response.body.items[0].status_code, 401);
    assert.equal(response.body.items[0].message, "Dentro do filtro");
  });

  test("GET /admin/logs returns validation error for non-positive status_code", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-invalid-status-admin",
      password: "LogSenha#213",
    });
    await clearLogs();

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs?status_code=0",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["status_code"]);
  });

  test("GET /admin/logs/summary requires authentication", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-summary-auth-admin",
      password: "LogSenha#209",
    });
    await createTestLog({
      level: "INFO",
      status_code: 200,
      message: "Log para summary real",
      route: "/auth/login",
      method: "POST",
    });

    const adminResponse = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs/summary",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(adminResponse.status, 200);
    assert.equal(typeof adminResponse.body?.success_count, "number");
    assert.equal(typeof adminResponse.body?.warn_count, "number");
    assert.equal(typeof adminResponse.body?.error_count, "number");

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs/summary",
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("GET /admin/logs/summary requires admin permission", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-summary-real-admin",
      password: "LogSenha#210",
    });
    await createTestLog({
      level: "INFO",
      status_code: 200,
      message: "Log para summary protegida",
      route: "/auth/login",
      method: "POST",
    });

    const adminResponse = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs/summary",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(adminResponse.status, 200);
    assert.equal(typeof adminResponse.body?.success_count, "number");

    await createTestUser({
      user_name: "log-summary-non-admin",
      password: "LogSenha#130",
    });
    const userToken = await loginAs({
      user_name: "log-summary-non-admin",
      password: "LogSenha#130",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs/summary",
      headers: {
        authorization: userToken,
      },
    });

    assert.equal(response.status, 403);
    assert.equal(response.body?.message, "Forbidden");
  });

  test("GET /admin/logs/summary returns counts for INFO, WARN, and ERROR", async () => {
    const adminToken = await createAdminAccessToken({
      user_name: "log-summary-admin",
      password: "LogSenha#131",
    });
    await clearLogs();

    await createTestLog({
      level: "INFO",
      status_code: 200,
      message: "Info um",
      route: "/auth/login",
      method: "POST",
    });
    await createTestLog({
      level: "INFO",
      status_code: 200,
      message: "Info dois",
      route: "/auth/logout",
      method: "POST",
    });
    await createTestLog({
      level: "WARN",
      status_code: 401,
      message: "Warn um",
      route: "/auth/refresh",
      method: "POST",
    });
    await createTestLog({
      level: "ERROR",
      status_code: 500,
      message: "Erro um",
      route: "/admin/logs",
      method: "GET",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin/logs/summary",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      success_count: 2,
      warn_count: 1,
      error_count: 1,
    });
  });
});
