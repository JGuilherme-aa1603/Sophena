import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Server } from "node:http";

import { createApp } from "../../../src/app.ts";
import {
  createTestUser,
  disconnectDatabase,
  findUserById,
  resetDatabase,
} from "../support/db-test-helpers.ts";
import {
  requestJson,
  requestMultipart,
  startHttpServer,
  stopHttpServer,
} from "./support/http-test-server.ts";

let server: Server | undefined;
const uploadedObjects: Array<{
  key: string;
  body: Buffer;
  contentType: string;
}> = [];
const deletedObjectUrls: string[] = [];

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
  uploadedObjects.length = 0;
  deletedObjectUrls.length = 0;
  await resetDatabase();

  server = await startHttpServer(
    createApp({
      userPictureImageProcessor: {
        async compressBookCover(input: {
          bytes: Buffer;
          mimeType: string;
        }) {
          return {
            bytes: Buffer.from(`compressed:${input.mimeType}:${input.bytes.length}`),
            contentType: "image/webp",
            extension: "webp",
          };
        },
      },
      userPictureStorage: {
        async putObject(input: {
          key: string;
          body: Buffer;
          contentType: string;
        }) {
          uploadedObjects.push({
            key: input.key,
            body: input.body,
            contentType: input.contentType,
          });

          return {
            url: `https://cdn.sophena.test/${input.key}`,
          };
        },
        async deleteObjectByUrl(url: string) {
          deletedObjectUrls.push(url);
        },
      },
    }),
  );
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

describe("PATCH /auth/me/picture", () => {
  test("requires authentication", async () => {
    const response = await requestMultipart(server!, {
      method: "PATCH",
      path: "/auth/me/picture",
      file: {
        fieldName: "file",
        fileName: "perfil.png",
        contentType: "image/png",
        bytes: new Uint8Array([1, 2, 3]),
      },
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("returns 400 when the image file is missing", async () => {
    await createTestUser({
      user_name: "foto-sem-arquivo",
      password: "FotoSenha#111",
    });
    const accessToken = await loginAs({
      user_name: "foto-sem-arquivo",
      password: "FotoSenha#111",
    });

    const response = await requestMultipart(server!, {
      method: "PATCH",
      path: "/auth/me/picture",
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body?.errors, [
      {
        field: "file",
        message: "file is required",
      },
    ]);
  });

  test("returns 400 when the file type is not a supported image", async () => {
    await createTestUser({
      user_name: "foto-tipo-invalido",
      password: "FotoSenha#222",
    });
    const accessToken = await loginAs({
      user_name: "foto-tipo-invalido",
      password: "FotoSenha#222",
    });

    const response = await requestMultipart(server!, {
      method: "PATCH",
      path: "/auth/me/picture",
      headers: {
        authorization: accessToken,
      },
      file: {
        fieldName: "file",
        fileName: "perfil.txt",
        contentType: "text/plain",
        bytes: new Uint8Array([65, 66, 67]),
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body?.message, "Validation failed");
    assert.deepEqual(response.body?.errors, [
      {
        field: "file",
        message: "file must be a JPEG, PNG, or WebP image",
      },
    ]);
  });

  test("uploads the picture, persists the URL, and returns the updated authenticated user", async () => {
    const user = await createTestUser({
      user_name: "foto-sucesso",
      password: "FotoSenha#333",
    });
    const accessToken = await loginAs({
      user_name: "foto-sucesso",
      password: "FotoSenha#333",
    });

    const response = await requestMultipart(server!, {
      method: "PATCH",
      path: "/auth/me/picture",
      headers: {
        authorization: accessToken,
      },
      file: {
        fieldName: "file",
        fileName: "minha foto.png",
        contentType: "image/png",
        bytes: new Uint8Array([137, 80, 78, 71]),
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.id, user.id);
    assert.equal(response.body.user_name, "foto-sucesso");
    assert.equal(response.body.is_admin, false);
    assert.match(response.body.user_picture_url, /^https:\/\/cdn\.sophena\.test\/user-pictures\/.+\.webp$/);
    assert.equal("password_hash" in response.body, false);

    const persistedUser = await findUserById(user.id);
    assert.equal(persistedUser?.user_picture_url, response.body.user_picture_url);
    assert.equal(uploadedObjects.length, 1);
    assert.match(uploadedObjects[0]!.key, /^user-pictures\/.+\.webp$/);
    assert.equal(uploadedObjects[0]!.contentType, "image/webp");
  });

  test("replaces the previous managed picture when the user updates it", async () => {
    const previousPictureUrl = "https://cdn.sophena.test/user-pictures/foto-antiga.webp";
    const user = await createTestUser({
      user_name: "foto-substituida",
      password: "FotoSenha#444",
      user_picture_url: previousPictureUrl,
    });
    const accessToken = await loginAs({
      user_name: "foto-substituida",
      password: "FotoSenha#444",
    });

    const response = await requestMultipart(server!, {
      method: "PATCH",
      path: "/auth/me/picture",
      headers: {
        authorization: accessToken,
      },
      file: {
        fieldName: "file",
        fileName: "nova-foto.webp",
        contentType: "image/webp",
        bytes: new Uint8Array([1, 2, 3, 4]),
      },
    });

    assert.equal(response.status, 200);
    assert.notEqual(response.body.user_picture_url, previousPictureUrl);

    const persistedUser = await findUserById(user.id);
    assert.equal(persistedUser?.user_picture_url, response.body.user_picture_url);
    assert.deepEqual(deletedObjectUrls, [previousPictureUrl]);
  });
});

describe("DELETE /auth/me/picture", () => {
  test("requires authentication", async () => {
    const response = await requestJson(server!, {
      method: "DELETE",
      path: "/auth/me/picture",
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("removes the user picture and deletes the managed object from storage", async () => {
    const pictureUrl = "https://cdn.sophena.test/user-pictures/foto-atual.webp";
    const user = await createTestUser({
      user_name: "foto-removida",
      password: "FotoSenha#555",
      user_picture_url: pictureUrl,
    });
    const accessToken = await loginAs({
      user_name: "foto-removida",
      password: "FotoSenha#555",
    });

    const response = await requestJson(server!, {
      method: "DELETE",
      path: "/auth/me/picture",
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.id, user.id);
    assert.equal(response.body.user_picture_url, null);
    assert.equal("password_hash" in response.body, false);

    const persistedUser = await findUserById(user.id);
    assert.equal(persistedUser?.user_picture_url, null);
    assert.deepEqual(deletedObjectUrls, [pictureUrl]);
  });

  test("is idempotent when the user has no picture", async () => {
    const user = await createTestUser({
      user_name: "foto-ja-vazia",
      password: "FotoSenha#666",
    });
    const accessToken = await loginAs({
      user_name: "foto-ja-vazia",
      password: "FotoSenha#666",
    });

    const response = await requestJson(server!, {
      method: "DELETE",
      path: "/auth/me/picture",
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.id, user.id);
    assert.equal(response.body.user_picture_url, null);
    assert.deepEqual(deletedObjectUrls, []);
  });
});
