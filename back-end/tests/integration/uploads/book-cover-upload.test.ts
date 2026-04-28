import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Server } from "node:http";

import type { BookCoverUploadService } from "../../../src/modules/uploads/presentation/http/upload-router.ts";
import { createApp } from "../../../src/app.ts";
import {
  createTestUser,
  disconnectDatabase,
  resetDatabase,
} from "../support/db-test-helpers.ts";
import {
  requestJson,
  requestMultipart,
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

  server = await startHttpServer(
    createApp({
      bookCoverUploadService: {
        async uploadBookCover(input: {
          originalFileName: string;
          objectKeyPrefix?: string;
        }) {
          return {
            url: `https://cdn.sophena.test/${input.objectKeyPrefix}/${input.originalFileName.replace(/\s+/g, "-")}.webp`,
          };
        },
      } satisfies BookCoverUploadService,
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

describe("Book cover upload", () => {
  test("requires authentication for POST /uploads/book-covers", async () => {
    const response = await requestMultipart(server!, {
      method: "POST",
      path: "/uploads/book-covers",
      file: {
        fieldName: "file",
        fileName: "capa.png",
        contentType: "image/png",
        bytes: new Uint8Array([1, 2, 3]),
      },
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("returns 400 when the image file is missing", async () => {
    await createTestUser({
      user_name: "upload-missing-file-user",
      password: "UploadSenha#111",
    });
    const accessToken = await loginAs({
      user_name: "upload-missing-file-user",
      password: "UploadSenha#111",
    });

    const response = await requestMultipart(server!, {
      method: "POST",
      path: "/uploads/book-covers",
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
      user_name: "upload-invalid-type-user",
      password: "UploadSenha#222",
    });
    const accessToken = await loginAs({
      user_name: "upload-invalid-type-user",
      password: "UploadSenha#222",
    });

    const response = await requestMultipart(server!, {
      method: "POST",
      path: "/uploads/book-covers",
      headers: {
        authorization: accessToken,
      },
      file: {
        fieldName: "file",
        fileName: "nota.txt",
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

  test("uploads the cover image and returns the public URL", async () => {
    await createTestUser({
      user_name: "upload-success-user",
      password: "UploadSenha#333",
    });
    const accessToken = await loginAs({
      user_name: "upload-success-user",
      password: "UploadSenha#333",
    });

    const response = await requestMultipart(server!, {
      method: "POST",
      path: "/uploads/book-covers",
      headers: {
        authorization: accessToken,
      },
      file: {
        fieldName: "file",
        fileName: "capa do livro.png",
        contentType: "image/png",
        bytes: new Uint8Array([137, 80, 78, 71]),
      },
    });

    assert.equal(response.status, 201);
    assert.deepEqual(Object.keys(response.body).sort(), ["url"]);
    assert.match(response.body.url, /^https:\/\/cdn\.sophena\.test\/book-covers\//);
    assert.match(response.body.url, /capa-do-livro\.png\.webp$/);
  });
});
