import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Server } from "node:http";

import { createApp } from "../../../src/app.ts";
import {
  countBookListItemsByBookId,
  countBooksByTitleAndAuthor,
  createTestBook,
  createTestBookListItem,
  createTestList,
  createTestUser,
  disconnectDatabase,
  findBookById,
  findListItemsByListId,
  resetDatabase,
} from "../support/db-test-helpers.ts";
import {
  requestJson,
  startHttpServer,
  stopHttpServer,
} from "../auth/support/http-test-server.ts";

let server: Server | undefined;
let deletedCoverUrls: string[] = [];

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
  deletedCoverUrls = [];
  server = await startHttpServer(createApp({
    bookCoverStorage: {
      async deleteObjectByUrl(url: string) {
        if (url.startsWith("https://pub-c31d766e66754764b7152a2a64220803.r2.dev/")) {
          deletedCoverUrls.push(url);
        }
      },
    },
  }));
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

  test("filters books by author with a partial case-insensitive match", async () => {
    await createTestUser({
      user_name: "books-reader-author-filter",
      password: "BooksSenha#224",
    });
    const accessToken = await loginAs({
      user_name: "books-reader-author-filter",
      password: "BooksSenha#224",
    });

    await createTestBook({
      title: "Dom Casmurro",
      author: "Machado de Assis",
    });
    await createTestBook({
      title: "A Hora da Estrela",
      author: "Clarice Lispector",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/books?author=clarice",
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.items.length, 1);
    assert.equal(response.body.items[0].title, "A Hora da Estrela");
  });

  test("filters books that have a cover", async () => {
    await createTestUser({
      user_name: "books-reader-cover-with",
      password: "BooksSenha#225",
    });
    const accessToken = await loginAs({
      user_name: "books-reader-cover-with",
      password: "BooksSenha#225",
    });

    await createTestBook({
      title: "Livro com Capa",
      author: "Autora",
      cover_url: "https://example.com/capa.jpg",
    });
    await createTestBook({
      title: "Livro sem Capa",
      author: "Autora",
      cover_url: null,
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/books?cover=with",
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.items.map((book: { title: string }) => book.title), ["Livro com Capa"]);
  });

  test("filters books that do not have a cover", async () => {
    await createTestUser({
      user_name: "books-reader-cover-without",
      password: "BooksSenha#226",
    });
    const accessToken = await loginAs({
      user_name: "books-reader-cover-without",
      password: "BooksSenha#226",
    });

    await createTestBook({
      title: "Livro com Capa",
      author: "Autora",
      cover_url: "https://example.com/capa.jpg",
    });
    await createTestBook({
      title: "Livro sem Capa",
      author: "Autora",
      cover_url: null,
    });
    await createTestBook({
      title: "Livro com Capa Vazia",
      author: "Autora",
      cover_url: "",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/books?cover=without",
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.items.map((book: { title: string }) => book.title).sort(),
      ["Livro com Capa Vazia", "Livro sem Capa"],
    );
  });

  test("combines search, author, and cover filters", async () => {
    await createTestUser({
      user_name: "books-reader-combined-filter",
      password: "BooksSenha#227",
    });
    const accessToken = await loginAs({
      user_name: "books-reader-combined-filter",
      password: "BooksSenha#227",
    });

    await createTestBook({
      title: "A Hora da Estrela",
      author: "Clarice Lispector",
      cover_url: "https://example.com/estrela.jpg",
    });
    await createTestBook({
      title: "Perto do Coracao Selvagem",
      author: "Clarice Lispector",
      cover_url: "https://example.com/perto.jpg",
    });
    await createTestBook({
      title: "Estrela Solitaria",
      author: "Autor Diferente",
      cover_url: "https://example.com/solitaria.jpg",
    });
    await createTestBook({
      title: "Uma Aprendizagem",
      author: "Clarice Lispector",
      cover_url: null,
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/books?search=estrela&author=clarice&cover=with",
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.items.map((book: { title: string }) => book.title), ["A Hora da Estrela"]);
  });

  test("returns 400 when cover filter has an invalid value", async () => {
    await createTestUser({
      user_name: "books-reader-invalid-cover-filter",
      password: "BooksSenha#228",
    });
    const accessToken = await loginAs({
      user_name: "books-reader-invalid-cover-filter",
      password: "BooksSenha#228",
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: "/books?cover=maybe",
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Validation failed");
    assert.deepEqual(response.body.errors.map((error: { field: string }) => error.field), ["cover"]);
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

  test("requires authentication for DELETE /books/:bookId", async () => {
    const book = await createTestBook({
      title: "Livro para apagar",
      author: "Autora",
      cover_url: null,
    });

    const response = await requestJson(server!, {
      method: "DELETE",
      path: `/books/${book.id}`,
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("rejects non-admin users when deleting a book", async () => {
    await createTestUser({
      user_name: "books-delete-reader",
      password: "BooksSenha#900",
    });
    const accessToken = await loginAs({
      user_name: "books-delete-reader",
      password: "BooksSenha#900",
    });
    const book = await createTestBook({
      title: "Livro protegido",
      author: "Autora",
      cover_url: null,
    });

    const response = await requestJson(server!, {
      method: "DELETE",
      path: `/books/${book.id}`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 403);
    assert.equal(response.body?.message, "Forbidden");
  });

  test("returns 404 when the admin tries to delete a book that does not exist", async () => {
    await createTestUser({
      user_name: "books-delete-admin-404",
      password: "BooksSenha#901",
      is_admin: true,
    });
    const accessToken = await loginAs({
      user_name: "books-delete-admin-404",
      password: "BooksSenha#901",
    });

    const response = await requestJson(server!, {
      method: "DELETE",
      path: "/books/00000000-0000-0000-0000-000000000000",
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 404);
    assert.equal(response.body?.message, "Resource not found");
  });

  test("deletes an unused book as admin and removes its managed cover from storage", async () => {
    await createTestUser({
      user_name: "books-delete-admin-success",
      password: "BooksSenha#902",
      is_admin: true,
    });
    const accessToken = await loginAs({
      user_name: "books-delete-admin-success",
      password: "BooksSenha#902",
    });
    const book = await createTestBook({
      title: "Livro sem uso",
      author: "Autora",
      cover_url: "https://pub-c31d766e66754764b7152a2a64220803.r2.dev/book-covers/livro-sem-uso.webp",
    });

    const response = await requestJson(server!, {
      method: "DELETE",
      path: `/books/${book.id}`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(response.body).sort(), ["id", "removed_from_lists_count"]);
    assert.equal(response.body.id, book.id);
    assert.equal(response.body.removed_from_lists_count, 0);
    assert.equal(await findBookById(book.id), null);
    assert.deepEqual(deletedCoverUrls, [book.cover_url]);
  });

  test("does not require storage deletion for an external cover url", async () => {
    await createTestUser({
      user_name: "books-delete-admin-external-cover",
      password: "BooksSenha#903",
      is_admin: true,
    });
    const accessToken = await loginAs({
      user_name: "books-delete-admin-external-cover",
      password: "BooksSenha#903",
    });
    const book = await createTestBook({
      title: "Livro com capa externa",
      author: "Autora",
      cover_url: "https://example.com/capas/livro-externo.jpg",
    });

    const response = await requestJson(server!, {
      method: "DELETE",
      path: `/books/${book.id}`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(await findBookById(book.id), null);
    assert.deepEqual(deletedCoverUrls, []);
  });

  test("asks for confirmation before deleting a book that is still used in lists", async () => {
    const admin = await createTestUser({
      user_name: "books-delete-admin-confirm",
      password: "BooksSenha#904",
      is_admin: true,
    });
    const owner = await createTestUser({
      user_name: "books-delete-owner-confirm",
      password: "BooksSenha#905",
    });
    const accessToken = await loginAs({
      user_name: admin.user_name,
      password: "BooksSenha#904",
    });
    const book = await createTestBook({
      title: "Livro em uso",
      author: "Autora",
      cover_url: "https://pub-c31d766e66754764b7152a2a64220803.r2.dev/book-covers/livro-em-uso.webp",
    });
    const list = await createTestList({
      name: "Quero ler",
      user_id: owner.id,
    });

    await createTestBookListItem({
      list_id: list.id,
      book_id: book.id,
      position: 1,
    });

    const response = await requestJson(server!, {
      method: "DELETE",
      path: `/books/${book.id}`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 409);
    assert.equal(response.body?.message, "Book is still used in lists");
    assert.equal(response.body?.requires_confirmation, true);
    assert.equal(response.body?.removed_from_lists_count, 1);
    assert.notEqual(await findBookById(book.id), null);
    assert.equal(await countBookListItemsByBookId(book.id), 1);
    assert.deepEqual(deletedCoverUrls, []);
  });

  test("deletes a used book with force=true, removes it from all lists, reorders positions, and removes the managed cover", async () => {
    const admin = await createTestUser({
      user_name: "books-delete-admin-force",
      password: "BooksSenha#906",
      is_admin: true,
    });
    const owner = await createTestUser({
      user_name: "books-delete-owner-force",
      password: "BooksSenha#907",
    });
    const accessToken = await loginAs({
      user_name: admin.user_name,
      password: "BooksSenha#906",
    });
    const deletedBook = await createTestBook({
      title: "Livro para apagar em cascata",
      author: "Autora",
      cover_url: "https://pub-c31d766e66754764b7152a2a64220803.r2.dev/book-covers/livro-cascata.webp",
    });
    const firstRemainingBook = await createTestBook({
      title: "Livro restante um",
      author: "Autora",
      cover_url: null,
    });
    const secondRemainingBook = await createTestBook({
      title: "Livro restante dois",
      author: "Autora",
      cover_url: null,
    });
    const listOne = await createTestList({
      name: "Lista um",
      user_id: owner.id,
    });
    const listTwo = await createTestList({
      name: "Lista dois",
      user_id: owner.id,
    });

    await createTestBookListItem({
      list_id: listOne.id,
      book_id: firstRemainingBook.id,
      position: 1,
    });
    await createTestBookListItem({
      list_id: listOne.id,
      book_id: deletedBook.id,
      position: 2,
    });
    await createTestBookListItem({
      list_id: listOne.id,
      book_id: secondRemainingBook.id,
      position: 3,
    });
    await createTestBookListItem({
      list_id: listTwo.id,
      book_id: deletedBook.id,
      position: 1,
    });
    await createTestBookListItem({
      list_id: listTwo.id,
      book_id: secondRemainingBook.id,
      position: 2,
    });

    const response = await requestJson(server!, {
      method: "DELETE",
      path: `/books/${deletedBook.id}?force=true`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body?.id, deletedBook.id);
    assert.equal(response.body?.removed_from_lists_count, 2);
    assert.equal(await findBookById(deletedBook.id), null);
    assert.equal(await countBookListItemsByBookId(deletedBook.id), 0);
    assert.deepEqual(deletedCoverUrls, [deletedBook.cover_url]);
    assert.deepEqual(
      (await findListItemsByListId(listOne.id)).map((item) => ({
        book_id: item.book_id,
        position: item.position,
      })),
      [
        { book_id: firstRemainingBook.id, position: 1 },
        { book_id: secondRemainingBook.id, position: 2 },
      ],
    );
    assert.deepEqual(
      (await findListItemsByListId(listTwo.id)).map((item) => ({
        book_id: item.book_id,
        position: item.position,
      })),
      [
        { book_id: secondRemainingBook.id, position: 1 },
      ],
    );
  });
});
