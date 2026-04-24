import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Server } from "node:http";

import { createApp } from "../../../src/app.ts";
import {
  createTestUser,
  disconnectDatabase,
  findUserWithAdminByUserName,
  resetDatabase,
} from "../support/db-test-helpers.ts";
import {
  requestJson,
  startHttpServer,
  stopHttpServer,
} from "../auth/support/http-test-server.ts";

let server: Server | undefined;

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

describe("POST /admin/users", () => {
  test("requires authentication", async () => {
    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      body: {
        user_name: "novo-usuario-auth",
        password: "SenhaNova#123",
        is_admin: false,
      },
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("requires admin permission", async () => {
    await createTestUser({
      user_name: "admin-criador",
      password: "AdminSenha#123",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-criador",
      password: "AdminSenha#123",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        user_name: "novo-usuario-admin",
        password: "SenhaNova#124",
        is_admin: false,
      },
    });

    assert.equal(response.status, 201);
    assert.equal(typeof response.body?.id, "string");
    assert.equal(response.body.user_name, "novo-usuario-admin");
    assert.equal(response.body.is_admin, false);
    assert.equal(typeof response.body.created_at, "string");
    assert.equal("password_hash" in response.body, false);
  });

  test("rejects non-admin users", async () => {
    await createTestUser({
      user_name: "usuario-sem-admin",
      password: "SenhaNormal#123",
    });
    const userToken = await loginAs({
      user_name: "usuario-sem-admin",
      password: "SenhaNormal#123",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: userToken,
      },
      body: {
        user_name: "novo-usuario-bloqueado",
        password: "SenhaNova#125",
        is_admin: false,
      },
    });

    assert.equal(response.status, 403);
    assert.equal(response.body?.message, "Forbidden");
  });

  test("creates a normal user", async () => {
    await createTestUser({
      user_name: "admin-normal-user",
      password: "AdminSenha#124",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-normal-user",
      password: "AdminSenha#124",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        user_name: "usuario-criado-normal",
        password: "SenhaNova#126",
        is_admin: false,
      },
    });

    assert.equal(response.status, 201);
    assert.equal(typeof response.body?.id, "string");
    assert.equal(response.body.user_name, "usuario-criado-normal");
    assert.equal(response.body.is_admin, false);
    assert.equal(typeof response.body.created_at, "string");
    assert.equal("password_hash" in response.body, false);
  });

  test("creates an admin user when requested", async () => {
    await createTestUser({
      user_name: "admin-admin-user",
      password: "AdminSenha#125",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-admin-user",
      password: "AdminSenha#125",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        user_name: "usuario-criado-admin",
        password: "SenhaNova#127",
        is_admin: true,
      },
    });

    assert.equal(response.status, 201);
    assert.equal(typeof response.body?.id, "string");
    assert.equal(response.body.user_name, "usuario-criado-admin");
    assert.equal(response.body.is_admin, true);
    assert.equal(typeof response.body.created_at, "string");
    assert.equal("password_hash" in response.body, false);
  });

  test("rejects duplicate user_name", async () => {
    await createTestUser({
      user_name: "admin-duplicate-user",
      password: "AdminSenha#126",
      is_admin: true,
    });
    await createTestUser({
      user_name: "usuario-ja-existente",
      password: "SenhaExistente#123",
    });
    const adminToken = await loginAs({
      user_name: "admin-duplicate-user",
      password: "AdminSenha#126",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        user_name: "usuario-ja-existente",
        password: "SenhaNova#128",
        is_admin: false,
      },
    });

    assert.equal(response.status, 409);
  });

  test("rejects missing user_name", async () => {
    await createTestUser({
      user_name: "admin-missing-user-name",
      password: "AdminSenha#127",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-missing-user-name",
      password: "AdminSenha#127",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        password: "SenhaNova#129",
        is_admin: false,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["user_name"]);
  });

  test("rejects missing password", async () => {
    await createTestUser({
      user_name: "admin-missing-password",
      password: "AdminSenha#128",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-missing-password",
      password: "AdminSenha#128",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        user_name: "usuario-sem-senha-admin",
        is_admin: false,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["password"]);
  });

  test("rejects blank user_name after trim", async () => {
    await createTestUser({
      user_name: "admin-blank-user-name",
      password: "AdminSenha#129",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-blank-user-name",
      password: "AdminSenha#129",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        user_name: "   ",
        password: "SenhaNova#130",
        is_admin: false,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["user_name"]);
  });

  test("rejects blank password after trim", async () => {
    await createTestUser({
      user_name: "admin-blank-password",
      password: "AdminSenha#130",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-blank-password",
      password: "AdminSenha#130",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        user_name: "usuario-senha-em-branco",
        password: "   ",
        is_admin: false,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["password"]);
  });

  test("rejects passwords shorter than 8 characters", async () => {
    await createTestUser({
      user_name: "admin-short-password",
      password: "AdminSenha#132",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-short-password",
      password: "AdminSenha#132",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        user_name: "usuario-senha-curta",
        password: "1234567",
        is_admin: false,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["password"]);
  });

  test("never returns password_hash", async () => {
    await createTestUser({
      user_name: "admin-sem-password-hash",
      password: "AdminSenha#133",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-sem-password-hash",
      password: "AdminSenha#133",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        user_name: "usuario-sem-password-hash",
        password: "SenhaNova#134",
        is_admin: false,
      },
    });

    assert.equal(response.status, 201);
    assert.equal("password_hash" in response.body, false);
    assert.equal("password" in response.body, false);
  });

  test("persists User and Admin correctly", async () => {
    await createTestUser({
      user_name: "admin-persistencia",
      password: "AdminSenha#134",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-persistencia",
      password: "AdminSenha#134",
    });

    const normalUserResponse = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        user_name: "usuario-persistido-normal",
        password: "SenhaNova#135",
        is_admin: false,
      },
    });
    const adminUserResponse = await requestJson(server!, {
      method: "POST",
      path: "/admin/users",
      headers: {
        authorization: adminToken,
      },
      body: {
        user_name: "usuario-persistido-admin",
        password: "SenhaNova#136",
        is_admin: true,
      },
    });

    assert.equal(normalUserResponse.status, 201);
    assert.equal(adminUserResponse.status, 201);

    const persistedNormalUser = await findUserWithAdminByUserName("usuario-persistido-normal");
    const persistedAdminUser = await findUserWithAdminByUserName("usuario-persistido-admin");

    assert.ok(persistedNormalUser);
    assert.ok(persistedAdminUser);
    assert.equal(persistedNormalUser.user_name, "usuario-persistido-normal");
    assert.equal(typeof persistedNormalUser.password_hash, "string");
    assert.ok(persistedNormalUser.password_hash.length > 0);
    assert.notEqual(persistedNormalUser.password_hash, "SenhaNova#135");
    assert.equal(persistedNormalUser.admin, null);

    assert.equal(persistedAdminUser.user_name, "usuario-persistido-admin");
    assert.equal(typeof persistedAdminUser.password_hash, "string");
    assert.ok(persistedAdminUser.password_hash.length > 0);
    assert.notEqual(persistedAdminUser.password_hash, "SenhaNova#136");
    assert.ok(persistedAdminUser.admin);
    assert.equal(persistedAdminUser.admin?.user_id, persistedAdminUser.id);
  });
});
