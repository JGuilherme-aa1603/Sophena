import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Server } from "node:http";

import { createApp } from "../../../src/app.ts";
import {
  createTestBook,
  createTestBookListItem,
  createTestList,
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
const previousR2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

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

async function createAuthenticatedUser(input: {
  user_name: string;
  password: string;
}) {
  const user = await createTestUser(input);
  const accessToken = await loginAs(input);

  return {
    user,
    accessToken,
  };
}

beforeEach(async () => {
  process.env.R2_PUBLIC_BASE_URL = "https://pub-c31d766e66754764b7152a2a64220803.r2.dev";
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
  restoreEnv("R2_PUBLIC_BASE_URL", previousR2PublicBaseUrl);
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

describe("Book list items", () => {
  test("requires authentication for GET /lists/:listId/items", async () => {
    const owner = await createTestUser({
      user_name: "items-get-auth-owner",
      password: "ItensSenha#111",
    });
    const list = await createTestList({
      name: "Lista autenticada GET",
      user_id: owner.id,
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: `/lists/${list.id}/items`,
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("requires authentication for POST /lists/:listId/items", async () => {
    const owner = await createTestUser({
      user_name: "items-post-auth-owner",
      password: "ItensSenha#112",
    });
    const list = await createTestList({
      name: "Lista autenticada POST",
      user_id: owner.id,
    });
    const book = await createTestBook({
      title: "Livro autenticado",
      author: "Autor autenticado",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: `/lists/${list.id}/items`,
      body: {
        book_id: book.id,
      },
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("requires authentication for DELETE /lists/:listId/items/:itemId", async () => {
    const owner = await createTestUser({
      user_name: "items-delete-auth-owner",
      password: "ItensSenha#113",
    });
    const list = await createTestList({
      name: "Lista autenticada DELETE",
      user_id: owner.id,
    });
    const book = await createTestBook({
      title: "Livro delete auth",
      author: "Autor delete auth",
    });
    const item = await createTestBookListItem({
      list_id: list.id,
      book_id: book.id,
      position: 1,
    });

    const response = await requestJson(server!, {
      method: "DELETE",
      path: `/lists/${list.id}/items/${item.id}`,
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("requires authentication for PATCH /lists/:listId/items/:itemId/reorder", async () => {
    const owner = await createTestUser({
      user_name: "items-reorder-auth-owner",
      password: "ItensSenha#114",
    });
    const list = await createTestList({
      name: "Lista autenticada reorder",
      user_id: owner.id,
    });
    const book = await createTestBook({
      title: "Livro reorder auth",
      author: "Autor reorder auth",
    });
    const item = await createTestBookListItem({
      list_id: list.id,
      book_id: book.id,
      position: 1,
    });

    const response = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${list.id}/items/${item.id}/reorder`,
      body: {
        position: 1,
      },
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("requires authentication for PATCH /lists/:listId/items/:itemId/move", async () => {
    const owner = await createTestUser({
      user_name: "items-move-auth-owner",
      password: "ItensSenha#115",
    });
    const sourceList = await createTestList({
      name: "Lista origem auth move",
      user_id: owner.id,
    });
    const targetList = await createTestList({
      name: "Lista destino auth move",
      user_id: owner.id,
    });
    const book = await createTestBook({
      title: "Livro move auth",
      author: "Autor move auth",
    });
    const item = await createTestBookListItem({
      list_id: sourceList.id,
      book_id: book.id,
      position: 1,
    });

    const response = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${sourceList.id}/items/${item.id}/move`,
      body: {
        target_list_id: targetList.id,
        target_position: 1,
      },
    });

    assert.equal(response.status, 401);
    assert.equal(response.body?.message, "Authentication required");
  });

  test("lists only owned items ordered by position", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-read-owned",
      password: "ItensSenha#221",
    });
    const list = await createTestList({
      name: "Lista ordenada",
      user_id: user.id,
    });
    const firstBook = await createTestBook({
      title: "Segundo na lista",
      author: "Autor B",
      cover_url: "https://example.com/segundo.jpg",
    });
    const secondBook = await createTestBook({
      title: "Primeiro na lista",
      author: "Autor A",
      cover_url: null,
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: firstBook.id,
      position: 2,
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: secondBook.id,
      position: 1,
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.list, {
      id: list.id,
      name: "Lista ordenada",
    });
    assert.ok(Array.isArray(response.body.items));
    assert.deepEqual(
      response.body.items.map((item: { position: number }) => item.position),
      [1, 2],
    );
    assert.deepEqual(
      response.body.items.map((item: { book: { title: string } }) => item.book.title),
      ["Primeiro na lista", "Segundo na lista"],
    );
    for (const item of response.body.items as Array<Record<string, unknown>>) {
      assert.deepEqual(Object.keys(item).sort(), ["book", "book_list_item_id", "id", "position"]);
      assert.equal(typeof item.id, "string");
      assert.equal(typeof item.book_list_item_id, "string");
      assert.deepEqual(Object.keys(item.book as Record<string, unknown>).sort(), [
        "author",
        "cover_url",
        "id",
        "title",
      ]);
    }
  });

  test("prevents access to another user's list items", async () => {
    const owner = await createTestUser({
      user_name: "items-owner-private",
      password: "ItensSenha#222",
    });
    const intruderSession = await createAuthenticatedUser({
      user_name: "items-intruder-private",
      password: "ItensSenha#223",
    });
    const list = await createTestList({
      name: "Lista privada",
      user_id: owner.id,
    });

    const response = await requestJson(server!, {
      method: "GET",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: intruderSession.accessToken,
      },
    });

    assert.equal(response.status, 404);
    assert.equal(response.body?.message, "Resource not found");
  });

  test("adds an existing global book to an owned list", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-add-existing",
      password: "ItensSenha#331",
    });
    const list = await createTestList({
      name: "Lista livro existente",
      user_id: user.id,
    });
    const book = await createTestBook({
      title: "Livro global existente",
      author: "Autora global",
      cover_url: "https://example.com/global.jpg",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
      body: {
        book_id: book.id,
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.list_id, list.id);
    assert.equal(response.body.book_id, book.id);
    assert.equal(response.body.position, 1);
    assert.equal(typeof response.body.id, "string");
    assert.equal(typeof response.body.created_at, "string");
  });

  test("adds a manual book to an owned list", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-add-manual",
      password: "ItensSenha#332",
    });
    const list = await createTestList({
      name: "Lista livro manual",
      user_id: user.id,
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
      body: {
        book: {
          title: "Livro manual novo",
          author: "Autora manual",
          cover_url: "https://pub-c31d766e66754764b7152a2a64220803.r2.dev/book-covers/manual.webp",
        },
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.list_id, list.id);
    assert.equal(response.body.position, 1);
    assert.equal(typeof response.body.book_id, "string");
    assert.equal(typeof response.body.created_at, "string");
  });

  test("rejects external cover URLs when adding a manual book", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-add-manual-external-cover",
      password: "ItensSenha#332",
    });
    const list = await createTestList({
      name: "Lista com capa externa",
      user_id: user.id,
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
      body: {
        book: {
          title: "Livro com capa externa",
          author: "Autora externa",
          cover_url: "https://example.com/manual.jpg",
        },
      },
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Validation failed");
    assert.deepEqual(response.body.errors, [
      {
        field: "cover_url",
        message: "cover_url must be a managed book cover URL",
      },
    ]);
  });

  test("reuses an existing global book when adding a manual book with the same title and author", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-add-manual-reuse",
      password: "ItensSenha#333",
    });
    const list = await createTestList({
      name: "Lista manual com reuse",
      user_id: user.id,
    });
    const existingBook = await createTestBook({
      title: "Livro global reutilizado",
      author: "Autor reaproveitado",
      cover_url: "https://example.com/original.jpg",
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
      body: {
        book: {
          title: "Livro global reutilizado",
          author: "Autor reaproveitado",
          cover_url: "https://pub-c31d766e66754764b7152a2a64220803.r2.dev/book-covers/outra.webp",
        },
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.list_id, list.id);
    assert.equal(response.body.book_id, existingBook.id);
    assert.equal(response.body.position, 1);
  });

  test("rejects duplicate book insertion in the same list", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-duplicate-book",
      password: "ItensSenha#334",
    });
    const list = await createTestList({
      name: "Lista sem duplicatas",
      user_id: user.id,
    });
    const book = await createTestBook({
      title: "Livro sem duplicar",
      author: "Autora sem duplicar",
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: book.id,
      position: 1,
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
      body: {
        book_id: book.id,
      },
    });

    assert.equal(response.status, 409);
    assert.equal(response.body?.message, "Book already exists in list");
  });

  test("inserts at the end when position is omitted", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-insert-end",
      password: "ItensSenha#335",
    });
    const list = await createTestList({
      name: "Lista inserir no final",
      user_id: user.id,
    });
    const firstBook = await createTestBook({
      title: "Primeiro existente final",
      author: "Autor final 1",
    });
    const secondBook = await createTestBook({
      title: "Segundo existente final",
      author: "Autor final 2",
    });
    const thirdBook = await createTestBook({
      title: "Novo no final",
      author: "Autor final 3",
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: firstBook.id,
      position: 1,
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: secondBook.id,
      position: 2,
    });

    const response = await requestJson(server!, {
      method: "POST",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
      body: {
        book_id: thirdBook.id,
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.position, 3);
  });

  test("inserts at a specific position and shifts affected items", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-insert-middle",
      password: "ItensSenha#336",
    });
    const list = await createTestList({
      name: "Lista inserir no meio",
      user_id: user.id,
    });
    const firstBook = await createTestBook({
      title: "Livro base um",
      author: "Autor base um",
    });
    const secondBook = await createTestBook({
      title: "Livro base dois",
      author: "Autor base dois",
    });
    const insertedBook = await createTestBook({
      title: "Livro inserido no meio",
      author: "Autor inserido",
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: firstBook.id,
      position: 1,
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: secondBook.id,
      position: 2,
    });

    const createResponse = await requestJson(server!, {
      method: "POST",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
      body: {
        book_id: insertedBook.id,
        position: 2,
      },
    });

    assert.equal(createResponse.status, 201);
    assert.equal(createResponse.body.position, 2);

    const readResponse = await requestJson(server!, {
      method: "GET",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(readResponse.status, 200);
    assert.deepEqual(
      readResponse.body.items.map((item: { book: { title: string }; position: number }) => ({
        title: item.book.title,
        position: item.position,
      })),
      [
        { title: "Livro base um", position: 1 },
        { title: "Livro inserido no meio", position: 2 },
        { title: "Livro base dois", position: 3 },
      ],
    );
  });

  test("handles concurrent insertions at the same target position without misclassifying the conflict", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-concurrent-position",
      password: "ItensSenha#336a",
    });
    const list = await createTestList({
      name: "Lista concorrente de posicao",
      user_id: user.id,
    });
    const existingBook = await createTestBook({
      title: "Livro base concorrente",
      author: "Autor base concorrente",
    });
    const insertedFirstBook = await createTestBook({
      title: "Livro concorrente um",
      author: "Autor concorrente um",
    });
    const insertedSecondBook = await createTestBook({
      title: "Livro concorrente dois",
      author: "Autor concorrente dois",
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: existingBook.id,
      position: 1,
    });

    const [firstResponse, secondResponse] = await Promise.all([
      requestJson(server!, {
        method: "POST",
        path: `/lists/${list.id}/items`,
        headers: {
          authorization: accessToken,
        },
        body: {
          book_id: insertedFirstBook.id,
          position: 1,
        },
      }),
      requestJson(server!, {
        method: "POST",
        path: `/lists/${list.id}/items`,
        headers: {
          authorization: accessToken,
        },
        body: {
          book_id: insertedSecondBook.id,
          position: 1,
        },
      }),
    ]);

    assert.equal(firstResponse.status, 201);
    assert.equal(secondResponse.status, 201);
    assert.notEqual(firstResponse.body.book_id, secondResponse.body.book_id);

    const readResponse = await requestJson(server!, {
      method: "GET",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(readResponse.status, 200);
    assert.deepEqual(
      readResponse.body.items.map((item: { position: number }) => item.position),
      [1, 2, 3],
    );
    assert.deepEqual(
      readResponse.body.items.map((item: { book: { title: string } }) => item.book.title).sort(),
      ["Livro base concorrente", "Livro concorrente dois", "Livro concorrente um"].sort(),
    );
  });

  test("removes an item and normalizes remaining positions", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-delete-reorder",
      password: "ItensSenha#337",
    });
    const list = await createTestList({
      name: "Lista remover e renormalizar",
      user_id: user.id,
    });
    const firstBook = await createTestBook({
      title: "Livro remover um",
      author: "Autor remover um",
    });
    const secondBook = await createTestBook({
      title: "Livro remover dois",
      author: "Autor remover dois",
    });
    const thirdBook = await createTestBook({
      title: "Livro remover tres",
      author: "Autor remover tres",
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: firstBook.id,
      position: 1,
    });
    const removedItem = await createTestBookListItem({
      list_id: list.id,
      book_id: secondBook.id,
      position: 2,
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: thirdBook.id,
      position: 3,
    });

    const deleteResponse = await requestJson(server!, {
      method: "DELETE",
      path: `/lists/${list.id}/items/${removedItem.id}`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteResponse.body.message, "Book removed from list");

    const readResponse = await requestJson(server!, {
      method: "GET",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(readResponse.status, 200);
    assert.deepEqual(
      readResponse.body.items.map((item: { book: { title: string }; position: number }) => ({
        title: item.book.title,
        position: item.position,
      })),
      [
        { title: "Livro remover um", position: 1 },
        { title: "Livro remover tres", position: 2 },
      ],
    );
  });

  test("moves an item up inside the same owned list", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-move-up",
      password: "ItensSenha#338",
    });
    const list = await createTestList({
      name: "Lista mover para cima",
      user_id: user.id,
    });
    const firstBook = await createTestBook({
      title: "Livro topo original",
      author: "Autor topo",
    });
    const movedBook = await createTestBook({
      title: "Livro movido para cima",
      author: "Autor movido cima",
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: firstBook.id,
      position: 1,
    });
    const movedItem = await createTestBookListItem({
      list_id: list.id,
      book_id: movedBook.id,
      position: 2,
    });

    const reorderResponse = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${list.id}/items/${movedItem.id}/reorder`,
      headers: {
        authorization: accessToken,
      },
      body: {
        position: 1,
      },
    });

    assert.equal(reorderResponse.status, 200);
    assert.equal(reorderResponse.body.position, 1);

    const readResponse = await requestJson(server!, {
      method: "GET",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(readResponse.status, 200);
    assert.deepEqual(
      readResponse.body.items.map((item: { book: { title: string }; position: number }) => ({
        title: item.book.title,
        position: item.position,
      })),
      [
        { title: "Livro movido para cima", position: 1 },
        { title: "Livro topo original", position: 2 },
      ],
    );
  });

  test("moves an item down inside the same owned list", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-move-down",
      password: "ItensSenha#339",
    });
    const list = await createTestList({
      name: "Lista mover para baixo",
      user_id: user.id,
    });
    const movedBook = await createTestBook({
      title: "Livro movido para baixo",
      author: "Autor movido baixo",
    });
    const secondBook = await createTestBook({
      title: "Livro que sobe",
      author: "Autor que sobe",
    });
    const movedItem = await createTestBookListItem({
      list_id: list.id,
      book_id: movedBook.id,
      position: 1,
    });
    await createTestBookListItem({
      list_id: list.id,
      book_id: secondBook.id,
      position: 2,
    });

    const reorderResponse = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${list.id}/items/${movedItem.id}/reorder`,
      headers: {
        authorization: accessToken,
      },
      body: {
        position: 2,
      },
    });

    assert.equal(reorderResponse.status, 200);
    assert.equal(reorderResponse.body.position, 2);

    const readResponse = await requestJson(server!, {
      method: "GET",
      path: `/lists/${list.id}/items`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(readResponse.status, 200);
    assert.deepEqual(
      readResponse.body.items.map((item: { book: { title: string }; position: number }) => ({
        title: item.book.title,
        position: item.position,
      })),
      [
        { title: "Livro que sobe", position: 1 },
        { title: "Livro movido para baixo", position: 2 },
      ],
    );
  });

  test("moves an item between two owned lists", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-move-between",
      password: "ItensSenha#340",
    });
    const sourceList = await createTestList({
      name: "Lista origem move",
      user_id: user.id,
    });
    const targetList = await createTestList({
      name: "Lista destino move",
      user_id: user.id,
    });
    const sourceBook = await createTestBook({
      title: "Livro movido entre listas",
      author: "Autor move listas",
    });
    const targetFirstBook = await createTestBook({
      title: "Livro ja no destino",
      author: "Autor destino",
    });
    const movedItem = await createTestBookListItem({
      list_id: sourceList.id,
      book_id: sourceBook.id,
      position: 1,
    });
    await createTestBookListItem({
      list_id: targetList.id,
      book_id: targetFirstBook.id,
      position: 1,
    });

    const moveResponse = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${sourceList.id}/items/${movedItem.id}/move`,
      headers: {
        authorization: accessToken,
      },
      body: {
        target_list_id: targetList.id,
        target_position: 1,
      },
    });

    assert.equal(moveResponse.status, 200);
    assert.equal(moveResponse.body.message, "Book moved successfully");

    const sourceReadResponse = await requestJson(server!, {
      method: "GET",
      path: `/lists/${sourceList.id}/items`,
      headers: {
        authorization: accessToken,
      },
    });
    const targetReadResponse = await requestJson(server!, {
      method: "GET",
      path: `/lists/${targetList.id}/items`,
      headers: {
        authorization: accessToken,
      },
    });

    assert.equal(sourceReadResponse.status, 200);
    assert.deepEqual(sourceReadResponse.body.items, []);
    assert.equal(targetReadResponse.status, 200);
    assert.deepEqual(
      targetReadResponse.body.items.map((item: { book: { title: string }; position: number }) => ({
        title: item.book.title,
        position: item.position,
      })),
      [
        { title: "Livro movido entre listas", position: 1 },
        { title: "Livro ja no destino", position: 2 },
      ],
    );
  });

  test("rejects moving an item to a target list that already contains the same book", async () => {
    const { user, accessToken } = await createAuthenticatedUser({
      user_name: "items-move-duplicate-target",
      password: "ItensSenha#341",
    });
    const sourceList = await createTestList({
      name: "Lista origem duplicada",
      user_id: user.id,
    });
    const targetList = await createTestList({
      name: "Lista destino duplicada",
      user_id: user.id,
    });
    const sharedBook = await createTestBook({
      title: "Livro presente nas duas",
      author: "Autora conflito",
    });
    const movedItem = await createTestBookListItem({
      list_id: sourceList.id,
      book_id: sharedBook.id,
      position: 1,
    });
    await createTestBookListItem({
      list_id: targetList.id,
      book_id: sharedBook.id,
      position: 1,
    });

    const response = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${sourceList.id}/items/${movedItem.id}/move`,
      headers: {
        authorization: accessToken,
      },
      body: {
        target_list_id: targetList.id,
        target_position: 1,
      },
    });

    assert.equal(response.status, 409);
    assert.equal(response.body?.message, "Book already exists in target list");
  });

  test("prevents modifying another user's list items", async () => {
    const owner = await createTestUser({
      user_name: "items-owner-mutation",
      password: "ItensSenha#342",
    });
    const intruderSession = await createAuthenticatedUser({
      user_name: "items-intruder-mutation",
      password: "ItensSenha#343",
    });
    const sourceList = await createTestList({
      name: "Lista de outra pessoa",
      user_id: owner.id,
    });
    const targetList = await createTestList({
      name: "Outra lista de outra pessoa",
      user_id: owner.id,
    });
    const book = await createTestBook({
      title: "Livro privado de item",
      author: "Autora privada de item",
    });
    const item = await createTestBookListItem({
      list_id: sourceList.id,
      book_id: book.id,
      position: 1,
    });

    const addResponse = await requestJson(server!, {
      method: "POST",
      path: `/lists/${sourceList.id}/items`,
      headers: {
        authorization: intruderSession.accessToken,
      },
      body: {
        book_id: book.id,
      },
    });
    const deleteResponse = await requestJson(server!, {
      method: "DELETE",
      path: `/lists/${sourceList.id}/items/${item.id}`,
      headers: {
        authorization: intruderSession.accessToken,
      },
    });
    const reorderResponse = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${sourceList.id}/items/${item.id}/reorder`,
      headers: {
        authorization: intruderSession.accessToken,
      },
      body: {
        position: 1,
      },
    });
    const moveResponse = await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${sourceList.id}/items/${item.id}/move`,
      headers: {
        authorization: intruderSession.accessToken,
      },
      body: {
        target_list_id: targetList.id,
        target_position: 1,
      },
    });

    assert.equal(addResponse.status, 404);
    assert.equal(deleteResponse.status, 404);
    assert.equal(reorderResponse.status, 404);
    assert.equal(moveResponse.status, 404);
    assert.equal(addResponse.body?.message, "Resource not found");
    assert.equal(deleteResponse.body?.message, "Resource not found");
    assert.equal(reorderResponse.body?.message, "Resource not found");
    assert.equal(moveResponse.body?.message, "Resource not found");
  });
});

describe("Book_List updated_at is bumped on item mutations", () => {
  async function getListUpdatedAt(accessToken: string, listId: string): Promise<string> {
    const response = await requestJson(server!, {
      method: "GET",
      path: "/lists",
      headers: { authorization: accessToken },
    });
    assert.equal(response.status, 200);
    const list = (response.body.items as Array<{ id: string; updated_at: string }>).find((l) => l.id === listId);
    assert.ok(list, "list not found in GET /lists response");
    return list.updated_at;
  }

  test("adding an item bumps the list updated_at", async () => {
    const { accessToken } = await createAuthenticatedUser({
      user_name: "bump-add-user",
      password: "BumpAdd#999",
    });
    const user = await createTestUser({ user_name: "bump-add-owner", password: "BumpAdd#998" });
    const list = await createTestList({ name: "Bump Add List", user_id: user.id });
    const book = await createTestBook({ title: "Bump Add Book", author: "Bump Author" });

    const ownerSession = await loginAs({ user_name: "bump-add-owner", password: "BumpAdd#998" });
    const before = new Date();

    await requestJson(server!, {
      method: "POST",
      path: `/lists/${list.id}/items`,
      headers: { authorization: ownerSession },
      body: { book_id: book.id },
    });

    const updatedAt = await getListUpdatedAt(ownerSession, list.id);
    assert.ok(new Date(updatedAt) >= before, "updated_at should be >= time before add");
  });

  test("removing an item bumps the list updated_at", async () => {
    const user = await createTestUser({ user_name: "bump-del-owner", password: "BumpDel#997" });
    const list = await createTestList({ name: "Bump Del List", user_id: user.id });
    const book = await createTestBook({ title: "Bump Del Book", author: "Bump Del Author" });
    const item = await createTestBookListItem({ list_id: list.id, book_id: book.id, position: 1 });
    const ownerSession = await loginAs({ user_name: "bump-del-owner", password: "BumpDel#997" });

    const before = new Date();

    await requestJson(server!, {
      method: "DELETE",
      path: `/lists/${list.id}/items/${item.id}`,
      headers: { authorization: ownerSession },
    });

    const updatedAt = await getListUpdatedAt(ownerSession, list.id);
    assert.ok(new Date(updatedAt) >= before, "updated_at should be >= time before delete");
  });

  test("reordering an item bumps the list updated_at", async () => {
    const user = await createTestUser({ user_name: "bump-reorder-owner", password: "BumpReorder#996" });
    const list = await createTestList({ name: "Bump Reorder List", user_id: user.id });
    const bookA = await createTestBook({ title: "Bump Reorder A", author: "Author A" });
    const bookB = await createTestBook({ title: "Bump Reorder B", author: "Author B" });
    const itemA = await createTestBookListItem({ list_id: list.id, book_id: bookA.id, position: 1 });
    await createTestBookListItem({ list_id: list.id, book_id: bookB.id, position: 2 });
    const ownerSession = await loginAs({ user_name: "bump-reorder-owner", password: "BumpReorder#996" });

    const before = new Date();

    await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${list.id}/items/${itemA.id}/reorder`,
      headers: { authorization: ownerSession },
      body: { position: 2 },
    });

    const updatedAt = await getListUpdatedAt(ownerSession, list.id);
    assert.ok(new Date(updatedAt) >= before, "updated_at should be >= time before reorder");
  });

  test("moving an item bumps updated_at on both source and destination lists", async () => {
    const user = await createTestUser({ user_name: "bump-move-owner", password: "BumpMove#995" });
    const sourceList = await createTestList({ name: "Bump Move Source", user_id: user.id });
    const destList = await createTestList({ name: "Bump Move Dest", user_id: user.id });
    const book = await createTestBook({ title: "Bump Move Book", author: "Bump Move Author" });
    const item = await createTestBookListItem({ list_id: sourceList.id, book_id: book.id, position: 1 });
    const ownerSession = await loginAs({ user_name: "bump-move-owner", password: "BumpMove#995" });

    const before = new Date();

    await requestJson(server!, {
      method: "PATCH",
      path: `/lists/${sourceList.id}/items/${item.id}/move`,
      headers: { authorization: ownerSession },
      body: { target_list_id: destList.id, target_position: 1 },
    });

    const sourceUpdatedAt = await getListUpdatedAt(ownerSession, sourceList.id);
    const destUpdatedAt = await getListUpdatedAt(ownerSession, destList.id);
    assert.ok(new Date(sourceUpdatedAt) >= before, "source list updated_at should be >= time before move");
    assert.ok(new Date(destUpdatedAt) >= before, "destination list updated_at should be >= time before move");
  });
});
