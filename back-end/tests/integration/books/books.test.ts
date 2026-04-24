import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Server } from "node:http";

import { createApp } from "../../../src/app.ts";
import {
  countBooksByTitleAndAuthor,
  createTestBook,
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

describe("Books", () => {
  test("requires authentication for GET /books", async () => {
    const response = await requestJson(server!, {
      method: "GET",
      path: "/books",
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("requires authentication for POST /books", async () => {
    const response = await requestJson(server!, {
      method: "POST",
      path: "/books",
      body: {
        title: "Dom Casmurro",
        author: "Machado de Assis",
      },
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("returns all books with minimal data when search is not provided", async () => {
    await createTestUser({
      user_name: "books-reader-all",
      password: "BooksSenha#111",
    });
    const accessToken = await loginAs({
      user_name: "books-reader-all",
      password: "BooksSenha#111",
    });

    await createTestBook({
      title: "Dom Casmurro",
      author: "Machado de Assis",
      cover_url: "https://example.com/dom-casmurro.jpg",
    });
    await createTestBook({
      title: "Memorias Postumas de Bras Cubas",
      author: "Machado de Assis",
      cover_url: null,
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/books",
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body?.items));
    assert.equal(response.body.items.length, 2);
    assert.deepEqual(
      response.body.items.map((book: { title: string }) => book.title).sort(),
      ["Dom Casmurro", "Memorias Postumas de Bras Cubas"],
    );
    for (const book of response.body.items as Array<Record<string, unknown>>) {
      assert.deepEqual(Object.keys(book).sort(), ["author", "cover_url", "id", "title"]);
    }
  });

  test("filters books by optional search across title and author", async () => {
    await createTestUser({
      user_name: "books-reader-search",
      password: "BooksSenha#222",
    });
    const accessToken = await loginAs({
      user_name: "books-reader-search",
      password: "BooksSenha#222",
    });

    await createTestBook({
      title: "Dom Casmurro",
      author: "Machado de Assis",
    });
    await createTestBook({
      title: "O Alienista",
      author: "Machado de Assis",
    });
    await createTestBook({
      title: "A Hora da Estrela",
      author: "Clarice Lispector",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/books?search=Clarice",
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body?.items));
    assert.equal(response.body.items.length, 1);
    assert.equal(response.body.items[0].title, "A Hora da Estrela");
    assert.equal(response.body.items[0].author, "Clarice Lispector");
  });

  test("creates a new global book with minimal response data", async () => {
    await createTestUser({
      user_name: "books-create-user",
      password: "BooksSenha#333",
    });
    const accessToken = await loginAs({
      user_name: "books-create-user",
      password: "BooksSenha#333",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/books",
      headers: {
        authorization: accessToken,
      },
      body: {
        title: "Capitaes da Areia",
        author: "Jorge Amado",
        cover_url: "https://example.com/capitaes.jpg",
      },
    });

    assert.equal(response.status, 201);
    assert.deepEqual(Object.keys(response.body).sort(), ["author", "cover_url", "id", "title"]);
    assert.equal(response.body.title, "Capitaes da Areia");
    assert.equal(response.body.author, "Jorge Amado");
    assert.equal(response.body.cover_url, "https://example.com/capitaes.jpg");
  });

  test("reuses an existing global book with the same title and author instead of duplicating it", async () => {
    await createTestUser({
      user_name: "books-reuse-user",
      password: "BooksSenha#444",
    });
    const accessToken = await loginAs({
      user_name: "books-reuse-user",
      password: "BooksSenha#444",
    });

    const existingBook = await createTestBook({
      title: "Vidas Secas",
      author: "Graciliano Ramos",
      cover_url: "https://example.com/vidas-secas.jpg",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/books",
      headers: {
        authorization: accessToken,
      },
      body: {
        title: "Vidas Secas",
        author: "Graciliano Ramos",
        cover_url: "https://example.com/outra-capa.jpg",
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.id, existingBook.id);
    assert.equal(response.body.title, "Vidas Secas");
    assert.equal(response.body.author, "Graciliano Ramos");

    const count = await countBooksByTitleAndAuthor({
      title: "Vidas Secas",
      author: "Graciliano Ramos",
    });

    assert.equal(count, 1);
  });

  test("creates the same global book concurrently without duplicating it", async () => {
    await createTestUser({
      user_name: "books-concurrent-user",
      password: "BooksSenha#449",
    });
    const accessToken = await loginAs({
      user_name: "books-concurrent-user",
      password: "BooksSenha#449",
    });

    const [firstResponse, secondResponse] = await Promise.all([
      requestJson(server!, {
        method: "POST",
        path: "/books",
        headers: {
          authorization: accessToken,
        },
        body: {
          title: "Grande Sertao: Veredas",
          author: "Joao Guimaraes Rosa",
          cover_url: "https://example.com/grande-sertao.jpg",
        },
      }),
      requestJson(server!, {
        method: "POST",
        path: "/books",
        headers: {
          authorization: accessToken,
        },
        body: {
          title: "Grande Sertao: Veredas",
          author: "Joao Guimaraes Rosa",
          cover_url: "https://example.com/outra-capa.jpg",
        },
      }),
    ]);

    assert.equal(firstResponse.status, 201);
    assert.equal(secondResponse.status, 201);
    assert.equal(firstResponse.body.id, secondResponse.body.id);
    assert.equal(firstResponse.body.title, "Grande Sertao: Veredas");
    assert.equal(secondResponse.body.author, "Joao Guimaraes Rosa");

    const count = await countBooksByTitleAndAuthor({
      title: "Grande Sertao: Veredas",
      author: "Joao Guimaraes Rosa",
    });

    assert.equal(count, 1);
  });

  test("rejects missing title", async () => {
    await createTestUser({
      user_name: "books-missing-title",
      password: "BooksSenha#555",
    });
    const accessToken = await loginAs({
      user_name: "books-missing-title",
      password: "BooksSenha#555",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/books",
      headers: {
        authorization: accessToken,
      },
      body: {
        author: "Machado de Assis",
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["title"]);
  });

  test("rejects missing author", async () => {
    await createTestUser({
      user_name: "books-missing-author",
      password: "BooksSenha#666",
    });
    const accessToken = await loginAs({
      user_name: "books-missing-author",
      password: "BooksSenha#666",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/books",
      headers: {
        authorization: accessToken,
      },
      body: {
        title: "Dom Casmurro",
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["author"]);
  });

  test("rejects invalid title type", async () => {
    await createTestUser({
      user_name: "books-invalid-title-type",
      password: "BooksSenha#667",
    });
    const accessToken = await loginAs({
      user_name: "books-invalid-title-type",
      password: "BooksSenha#667",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/books",
      headers: {
        authorization: accessToken,
      },
      body: {
        title: 12345,
        author: "Machado de Assis",
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["title"]);
  });

  test("rejects invalid author type", async () => {
    await createTestUser({
      user_name: "books-invalid-author-type",
      password: "BooksSenha#668",
    });
    const accessToken = await loginAs({
      user_name: "books-invalid-author-type",
      password: "BooksSenha#668",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/books",
      headers: {
        authorization: accessToken,
      },
      body: {
        title: "Dom Casmurro",
        author: 12345,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["author"]);
  });

  test("rejects blank title after trim", async () => {
    await createTestUser({
      user_name: "books-blank-title",
      password: "BooksSenha#777",
    });
    const accessToken = await loginAs({
      user_name: "books-blank-title",
      password: "BooksSenha#777",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/books",
      headers: {
        authorization: accessToken,
      },
      body: {
        title: "   ",
        author: "Machado de Assis",
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["title"]);
  });

  test("rejects blank author after trim", async () => {
    await createTestUser({
      user_name: "books-blank-author",
      password: "BooksSenha#888",
    });
    const accessToken = await loginAs({
      user_name: "books-blank-author",
      password: "BooksSenha#888",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: "/books",
      headers: {
        authorization: accessToken,
      },
      body: {
        title: "Dom Casmurro",
        author: "   ",
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["author"]);
  });

  for (const invalidCoverUrlCase of [
    {
      name: "number",
      cover_url: 12345,
    },
    {
      name: "object",
      cover_url: { href: "https://example.com/capa.jpg" },
    },
    {
      name: "array",
      cover_url: ["https://example.com/capa.jpg"],
    },
  ] as const) {
    test(`rejects invalid cover_url type when it is ${invalidCoverUrlCase.name}`, async () => {
      await createTestUser({
        user_name: `books-invalid-cover-${invalidCoverUrlCase.name}`,
        password: "BooksSenha#889",
      });
      const accessToken = await loginAs({
        user_name: `books-invalid-cover-${invalidCoverUrlCase.name}`,
        password: "BooksSenha#889",
      });

      const response = await requestJson(server!, {
        method: "POST",
        path: "/books",
        headers: {
          authorization: accessToken,
        },
        body: {
          title: "Dom Casmurro",
          author: "Machado de Assis",
          cover_url: invalidCoverUrlCase.cover_url,
        },
      });

      assert.equal(response.status, 400);
      assert.equal(response.body.message, "Validation failed");
      assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["cover_url"]);
    });
  }
});
