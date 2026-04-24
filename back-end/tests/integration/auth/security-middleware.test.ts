import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import express, { Router } from "express";
import type { Server } from "node:http";

import { createAuthRouter } from "../../../src/modules/auth/presentation/http/auth-router.ts";
import {
  requireAdminUser,
  requireAuthenticatedUser,
  requireUserOwnership,
} from "../../../src/modules/auth/presentation/http/security-middleware.ts";
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

function createSecurityProbeApp() {
  const app = express();
  const router = Router();

  app.use(express.json());
  app.use("/auth", createAuthRouter());

  router.get("/protected", requireAuthenticatedUser, (_request, response) => {
    response.status(200).json({
      ok: true,
    });
  });

  router.get("/admin", requireAuthenticatedUser, requireAdminUser, (_request, response) => {
    response.status(200).json({
      ok: true,
    });
  });

  router.get(
    "/users/:userId/resource",
    requireAuthenticatedUser,
    requireUserOwnership("userId"),
    (_request, response) => {
      response.status(200).json({
        ok: true,
      });
    },
  );

  app.use(router);

  return app;
}

beforeEach(async () => {
  await resetDatabase();
  server = await startHttpServer(createSecurityProbeApp());
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

describe("Security middleware", () => {
  test("requires authentication for protected routes", async () => {
    const response = await requestJson(server!, {
      method: "GET",
      path: "/protected",
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("allows admin-only routes for admins", async () => {
    await createTestUser({
      user_name: "admin-seguranca",
      password: "AdminSenha#999",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-seguranca",
      password: "AdminSenha#999",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin",
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { ok: true });
  });

  test("blocks admin-only routes for non-admin users", async () => {
    await createTestUser({
      user_name: "usuario-seguranca",
      password: "SenhaSegura#999",
    });
    const userToken = await loginAs({
      user_name: "usuario-seguranca",
      password: "SenhaSegura#999",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/admin",
      headers: {
        authorization: userToken,
      },
    });

    assert.equal(response.status, 403);
    assert.equal(response.body?.message, "Forbidden");
  });

  test("allows access to owned resources", async () => {
    const user = await createTestUser({
      user_name: "propria-usuaria",
      password: "SenhaSegura#111",
    });
    const userToken = await loginAs({
      user_name: "propria-usuaria",
      password: "SenhaSegura#111",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: `/users/${user.id}/resource`,
      headers: {
        authorization: userToken,
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { ok: true });
  });

  test("blocks access to another user's resources for non-admin users", async () => {
    const targetUser = await createTestUser({
      user_name: "alvo-da-ownership",
      password: "SenhaSegura#222",
    });
    await createTestUser({
      user_name: "outra-ownership",
      password: "SenhaSegura#333",
    });
    const userToken = await loginAs({
      user_name: "outra-ownership",
      password: "SenhaSegura#333",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: `/users/${targetUser.id}/resource`,
      headers: {
        authorization: userToken,
      },
    });

    assert.equal(response.status, 404);
    assert.equal(response.body?.message, "Resource not found");
  });

  test("allows admins to access another user's resources", async () => {
    const targetUser = await createTestUser({
      user_name: "target-admin-check",
      password: "SenhaSegura#444",
    });
    await createTestUser({
      user_name: "admin-ownership",
      password: "AdminSenha#444",
      is_admin: true,
    });
    const adminToken = await loginAs({
      user_name: "admin-ownership",
      password: "AdminSenha#444",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: `/users/${targetUser.id}/resource`,
      headers: {
        authorization: adminToken,
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { ok: true });
  });

  test("rejects invalid route param shapes before ownership validation", async () => {
    await createTestUser({
      user_name: "ownership-param-user",
      password: "SenhaSegura#555",
    });
    const userToken = await loginAs({
      user_name: "ownership-param-user",
      password: "SenhaSegura#555",
    });
    const middleware = requireUserOwnership("userId");
    let statusCode = 0;
    let responseBody: unknown;
    let nextCalled = false;

    await middleware(
      {
        params: {
          userId: ["invalid-array-shape"],
        },
      } as never,
      {
        locals: {
          authenticatedUser: {
            id: "some-user-id",
            user_name: "ownership-param-user",
            is_admin: false,
          },
        },
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(body: unknown) {
          responseBody = body;
        },
      } as never,
      () => {
        nextCalled = true;
      },
    );

    assert.equal(nextCalled, false);
    assert.equal(statusCode, 404);
    assert.deepEqual(responseBody, {
      message: "Resource not found",
    });
  });
});
