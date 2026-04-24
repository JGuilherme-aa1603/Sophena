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

describe("Lists CRUD", () => {
  test("creates a list for the authenticated user", async () => {
    await createTestUser({
      user_name: "lista-user",
      password: "SenhaLista#123",
    });
    const userToken = await loginAs({
      user_name: "lista-user",
      password: "SenhaLista#123",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Lidos em 2026",
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.name, "Lidos em 2026");
    assert.equal(typeof response.body.id, "string");
    assert.ok(response.body.id.length > 0);
    assert.equal(typeof response.body.created_at, "string");
    assert.equal(typeof response.body.updated_at, "string");
  });

  test("lists only the authenticated user's lists", async () => {
    await createTestUser({
      user_name: "lista-own-user",
      password: "SenhaLista#111",
    });
    await createTestUser({
      user_name: "lista-other-user",
      password: "SenhaLista#222",
    });
    const userToken = await loginAs({
      user_name: "lista-own-user",
      password: "SenhaLista#111",
    });
    const otherUserToken = await loginAs({
      user_name: "lista-other-user",
      password: "SenhaLista#222",
    });

    await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Lista da usuaria autenticada",
      },
    });

    await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: otherUserToken,
      },
      body: {
        name: "Lista de outra usuaria",
      },
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
    });

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.items));
    assert.equal(response.body.items.length, 1);
    assert.equal(response.body.items[0].name, "Lista da usuaria autenticada");
  });

  test("updates the name of an owned list", async () => {
    await createTestUser({
      user_name: "lista-update-user",
      password: "SenhaLista#333",
    });
    const userToken = await loginAs({
      user_name: "lista-update-user",
      password: "SenhaLista#333",
    });

    const createResponse = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Quero ler",
      },
    });

    const response = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${createResponse.body.id}`,
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Quero ler primeiro",
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.id, createResponse.body.id);
    assert.equal(response.body.name, "Quero ler primeiro");
    assert.equal(typeof response.body.updated_at, "string");
  });

  test("deletes an owned list", async () => {
    await createTestUser({
      user_name: "lista-delete-user",
      password: "SenhaLista#444",
    });
    const userToken = await loginAs({
      user_name: "lista-delete-user",
      password: "SenhaLista#444",
    });

    const createResponse = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Para remover",
      },
    });

    const deleteResponse = await requestJson(server!, {
      method: "DELETE",
      path: `/lists/${createResponse.body.id}`,
      headers: {
        authorization: userToken,
      },
    });

    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteResponse.body.message, "List deleted successfully");

    const listResponse = await requestJson(server!, {
      method: "GET",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
    });

    assert.equal(listResponse.status, 200);
    assert.deepEqual(listResponse.body.items, []);
  });

  test("requires authentication for list routes", async () => {
    const response = await requestJson(server!, {
      method: "GET",
      path: "/lists",
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.message, "Authentication required");
  });

  test("returns 400 when creating a list without a valid name", async () => {
    await createTestUser({
      user_name: "lista-invalid-create",
      password: "SenhaLista#555",
    });
    const userToken = await loginAs({
      user_name: "lista-invalid-create",
      password: "SenhaLista#555",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {},
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Validation failed");
    assert.ok(Array.isArray(response.body.errors));
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["name"]);
  });

  test("returns 400 when updating a list without a valid name", async () => {
    await createTestUser({
      user_name: "lista-invalid-update",
      password: "SenhaLista#666",
    });
    const userToken = await loginAs({
      user_name: "lista-invalid-update",
      password: "SenhaLista#666",
    });

    const createResponse = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Lista original",
      },
    });

    const response = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${createResponse.body.id}`,
      headers: {
        authorization: userToken,
      },
      body: {},
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Validation failed");
    assert.ok(Array.isArray(response.body.errors));
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["name"]);
  });

  test("does not allow duplicate list names for the same user", async () => {
    await createTestUser({
      user_name: "lista-duplicate-user",
      password: "SenhaLista#777",
    });
    const userToken = await loginAs({
      user_name: "lista-duplicate-user",
      password: "SenhaLista#777",
    });

    await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Duplicada",
      },
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Duplicada",
      },
    });

    assert.equal(response.status, 409);
    assert.equal(response.body.message, "List name already exists");
  });

  test("allows the same list name for different users", async () => {
    await createTestUser({
      user_name: "lista-shared-user-1",
      password: "SenhaLista#888",
    });
    await createTestUser({
      user_name: "lista-shared-user-2",
      password: "SenhaLista#889",
    });
    const userToken = await loginAs({
      user_name: "lista-shared-user-1",
      password: "SenhaLista#888",
    });
    const otherUserToken = await loginAs({
      user_name: "lista-shared-user-2",
      password: "SenhaLista#889",
    });

    const firstResponse = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Favoritos",
      },
    });

    const secondResponse = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: otherUserToken,
      },
      body: {
        name: "Favoritos",
      },
    });

    assert.equal(firstResponse.status, 201);
    assert.equal(secondResponse.status, 201);
    assert.notEqual(firstResponse.body.id, secondResponse.body.id);
  });

  test("prevents reading another user's lists even for admin routes outside admin scope", async () => {
    await createTestUser({
      user_name: "lista-private-user",
      password: "SenhaLista#990",
    });
    await createTestUser({
      user_name: "lista-admin-view",
      password: "AdminLista#990",
      is_admin: true,
    });
    const userToken = await loginAs({
      user_name: "lista-private-user",
      password: "SenhaLista#990",
    });
    const adminToken = await loginAs({
      user_name: "lista-admin-view",
      password: "AdminLista#990",
    });

    await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Lista privada da usuaria",
      },
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/lists",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.items, []);
  });

  test("prevents updating another user's list", async () => {
    await createTestUser({
      user_name: "lista-owner-user",
      password: "SenhaLista#991",
    });
    await createTestUser({
      user_name: "lista-attacker-user",
      password: "SenhaLista#992",
    });
    const userToken = await loginAs({
      user_name: "lista-owner-user",
      password: "SenhaLista#991",
    });
    const otherUserToken = await loginAs({
      user_name: "lista-attacker-user",
      password: "SenhaLista#992",
    });

    const createResponse = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Lista privada",
      },
    });

    const response = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${createResponse.body.id}`,
      headers: {
        authorization: otherUserToken,
      },
      body: {
        name: "Tentativa invalida",
      },
    });

    assert.equal(response.status, 404);
    assert.equal(response.body.message, "Resource not found");
  });

  test("prevents deleting another user's list", async () => {
    await createTestUser({
      user_name: "lista-delete-owner",
      password: "SenhaLista#993",
    });
    await createTestUser({
      user_name: "lista-delete-attacker",
      password: "SenhaLista#994",
    });
    const userToken = await loginAs({
      user_name: "lista-delete-owner",
      password: "SenhaLista#993",
    });
    const otherUserToken = await loginAs({
      user_name: "lista-delete-attacker",
      password: "SenhaLista#994",
    });

    const createResponse = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Nao pode apagar",
      },
    });

    const response = await requestJson(server!, {
      method: "DELETE",
      path: `/lists/${createResponse.body.id}`,
      headers: {
        authorization: otherUserToken,
      },
    });

    assert.equal(response.status, 404);
    assert.equal(response.body.message, "Resource not found");
  });

  test("prevents an admin from updating another user's list", async () => {
    await createTestUser({
      user_name: "lista-admin-target",
      password: "SenhaLista#995",
    });
    await createTestUser({
      user_name: "lista-admin-attacker",
      password: "AdminLista#995",
      is_admin: true,
    });
    const userToken = await loginAs({
      user_name: "lista-admin-target",
      password: "SenhaLista#995",
    });
    const adminToken = await loginAs({
      user_name: "lista-admin-attacker",
      password: "AdminLista#995",
    });

    const createResponse = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Admin nao acessa",
      },
    });

    const response = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${createResponse.body.id}`,
      headers: {
        authorization: adminToken,
      },
      body: {
        name: "Nome proibido",
      },
    });

    assert.equal(response.status, 404);
    assert.equal(response.body.message, "Resource not found");
  });

  test("persists list data across app instances", async () => {
    await createTestUser({
      user_name: "lista-persist-user",
      password: "SenhaLista#996",
    });
    const userToken = await loginAs({
      user_name: "lista-persist-user",
      password: "SenhaLista#996",
    });

    const createResponse = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "Persistida no banco",
      },
    });

    assert.equal(createResponse.status, 201);

    await stopHttpServer(server!);
    server = await startHttpServer(createApp());

    const newUserToken = await loginAs({
      user_name: "lista-persist-user",
      password: "SenhaLista#996",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/lists",
      headers: {
        authorization: newUserToken,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.items.length, 1);
    assert.equal(response.body.items[0].id, createResponse.body.id);
    assert.equal(response.body.items[0].name, "Persistida no banco");
  });

  test("returns 400 when creating a list with a blank name after trim", async () => {
    await createTestUser({
      user_name: "lista-blank-user",
      password: "SenhaLista#997",
    });
    const userToken = await loginAs({
      user_name: "lista-blank-user",
      password: "SenhaLista#997",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/lists",
      headers: {
        authorization: userToken,
      },
      body: {
        name: "   ",
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["name"]);
  });
});
