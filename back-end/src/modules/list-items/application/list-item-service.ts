import { ResourceNotFoundError, ValidationError } from "../../auth/application/auth-errors.ts";
import { type AuthenticatedUserView } from "../../auth/domain/auth-user.ts";
import { type Book } from "../../books/domain/book.ts";
import { type BookList } from "../../lists/domain/book-list.ts";
import {
  type BookListItem,
  type BookListItemWithBook,
  toBookListItemReadView,
  toBookListItemReorderView,
  toBookListItemView,
} from "../domain/book-list-item.ts";
import {
  BookAlreadyExistsInListError,
  BookAlreadyExistsInTargetListError,
} from "./list-item-errors.ts";

export type ListItemRepository = {
  findListById(listId: string): Promise<BookList | null>;
  findBookById(bookId: string): Promise<Book | null>;
  createOrReuseBook(input: { title: string; author: string; cover_url?: string | null }): Promise<Book>;
  findItemById(itemId: string): Promise<BookListItem | null>;
  findItemsByListId(listId: string): Promise<BookListItemWithBook[]>;
  createItem(input: { list_id: string; book_id: string; position?: number }): Promise<BookListItem>;
  deleteItem(input: { list_id: string; item_id: string }): Promise<void>;
  reorderItem(input: { list_id: string; item_id: string; position: number }): Promise<BookListItem>;
  moveItem(input: {
    source_list_id: string;
    item_id: string;
    target_list_id: string;
    target_position: number;
  }): Promise<void>;
};

type CreateListItemInput = {
  book_id?: unknown;
  book?: unknown;
  position?: unknown;
};

type ReorderListItemInput = {
  position?: unknown;
};

type MoveListItemInput = {
  target_list_id?: unknown;
  target_position?: unknown;
};

export class ListItemService {
  constructor(private readonly listItemRepository: ListItemRepository) {}

  async readListItems(
    authenticatedUser: AuthenticatedUserView,
    listId: string,
  ) {
    const list = await this.getOwnedListOrFail(authenticatedUser.id, listId);
    const items = await this.listItemRepository.findItemsByListId(list.id);

    return {
      list: {
        id: list.id,
        name: list.name,
      },
      items: items.map(toBookListItemReadView),
    };
  }

  async createListItem(
    authenticatedUser: AuthenticatedUserView,
    listId: string,
    input: CreateListItemInput,
  ) {
    const list = await this.getOwnedListOrFail(authenticatedUser.id, listId);
    const parsedInput = validateCreateListItemInput(input);
    const bookId = await this.resolveBookId(parsedInput);

    const createdItem = await this.listItemRepository.createItem({
      list_id: list.id,
      book_id: bookId,
      position: parsedInput.position,
    });

    return toBookListItemView(createdItem);
  }

  async deleteListItem(
    authenticatedUser: AuthenticatedUserView,
    listId: string,
    itemId: string,
  ) {
    await this.getOwnedItemOrFail(authenticatedUser.id, listId, itemId);
    await this.listItemRepository.deleteItem({
      list_id: listId,
      item_id: itemId,
    });

    return {
      message: "Book removed from list",
    };
  }

  async reorderListItem(
    authenticatedUser: AuthenticatedUserView,
    listId: string,
    itemId: string,
    input: ReorderListItemInput,
  ) {
    await this.getOwnedItemOrFail(authenticatedUser.id, listId, itemId);
    const parsedInput = validateReorderListItemInput(input);
    const reorderedItem = await this.listItemRepository.reorderItem({
      list_id: listId,
      item_id: itemId,
      position: parsedInput.position,
    });

    return toBookListItemReorderView(reorderedItem);
  }

  async moveListItem(
    authenticatedUser: AuthenticatedUserView,
    sourceListId: string,
    itemId: string,
    input: MoveListItemInput,
  ) {
    await this.getOwnedItemOrFail(authenticatedUser.id, sourceListId, itemId);
    const parsedInput = validateMoveListItemInput(input);
    await this.getOwnedListOrFail(authenticatedUser.id, parsedInput.target_list_id);
    await this.listItemRepository.moveItem({
      source_list_id: sourceListId,
      item_id: itemId,
      target_list_id: parsedInput.target_list_id,
      target_position: parsedInput.target_position,
    });

    return {
      message: "Book moved successfully",
    };
  }

  private async getOwnedListOrFail(userId: string, listId: string) {
    const list = await this.listItemRepository.findListById(listId);

    if (!list || list.user_id !== userId) {
      throw new ResourceNotFoundError();
    }

    return list;
  }

  private async getOwnedItemOrFail(
    userId: string,
    listId: string,
    itemId: string,
  ) {
    await this.getOwnedListOrFail(userId, listId);
    const item = await this.listItemRepository.findItemById(itemId);

    if (!item || item.list_id !== listId) {
      throw new ResourceNotFoundError();
    }

    return item;
  }

  private async resolveBookId(
    input:
      | {
        book_id: string;
        position?: number;
      }
      | {
        book: {
          title: string;
          author: string;
          cover_url: string | null;
        };
        position?: number;
      },
  ) {
    if ("book_id" in input) {
      const book = await this.listItemRepository.findBookById(input.book_id);

      if (!book) {
        throw new ResourceNotFoundError();
      }

      return book.id;
    }

    const book = await this.listItemRepository.createOrReuseBook(input.book);
    return book.id;
  }
}

function validateCreateListItemInput(input: CreateListItemInput) {
  const errors: Array<{ field: string; message: string }> = [];
  const hasBookId = input.book_id !== undefined;
  const hasManualBook = input.book !== undefined;
  const parsedPosition = parsePositiveInteger(input.position, "position", errors, false);

  if (hasBookId === hasManualBook) {
    errors.push({
      field: "book",
      message: "provide either book_id or book",
    });
  }

  if (hasBookId) {
    if (typeof input.book_id !== "string" || input.book_id.trim().length === 0) {
      errors.push({
        field: "book_id",
        message: "book_id must be a string",
      });
    }
  }

  if (hasManualBook) {
    if (!isObject(input.book)) {
      errors.push({
        field: "book",
        message: "book must be an object",
      });
    } else {
      const title = typeof input.book.title === "string" ? input.book.title : null;
      const author = typeof input.book.author === "string" ? input.book.author : null;
      const coverUrl = input.book.cover_url;

      if (!title || title.trim().length === 0) {
        errors.push({
          field: "title",
          message: "title must be a string",
        });
      }

      if (!author || author.trim().length === 0) {
        errors.push({
          field: "author",
          message: "author must be a string",
        });
      }

      if (coverUrl !== undefined && coverUrl !== null && typeof coverUrl !== "string") {
        errors.push({
          field: "cover_url",
          message: "cover_url must be a string, null, or undefined",
        });
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  if (hasBookId) {
    return {
      book_id: (input.book_id as string).trim(),
      position: parsedPosition,
    };
  }

  return {
    book: {
      title: (input.book as { title: string }).title.trim(),
      author: (input.book as { author: string }).author.trim(),
      cover_url: typeof (input.book as { cover_url?: unknown }).cover_url === "string"
        ? (input.book as { cover_url: string }).cover_url
        : null,
    },
    position: parsedPosition,
  };
}

function validateReorderListItemInput(input: ReorderListItemInput) {
  const errors: Array<{ field: string; message: string }> = [];
  const parsedPosition = parsePositiveInteger(input.position, "position", errors, true);

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    position: parsedPosition!,
  };
}

function validateMoveListItemInput(input: MoveListItemInput) {
  const errors: Array<{ field: string; message: string }> = [];
  const targetListId = typeof input.target_list_id === "string" ? input.target_list_id : null;
  const targetPosition = parsePositiveInteger(
    input.target_position,
    "target_position",
    errors,
    true,
  );

  if (!targetListId || targetListId.trim().length === 0) {
    errors.push({
      field: "target_list_id",
      message: "target_list_id must be a string",
    });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    target_list_id: targetListId!.trim(),
    target_position: targetPosition!,
  };
}

function parsePositiveInteger(
  value: unknown,
  field: string,
  errors: Array<{ field: string; message: string }>,
  required: boolean,
) {
  if (value === undefined) {
    if (required) {
      errors.push({
        field,
        message: `${field} must be a positive integer`,
      });
    }

    return undefined;
  }

  if (!Number.isInteger(value) || Number(value) <= 0) {
    errors.push({
      field,
      message: `${field} must be a positive integer`,
    });
    return undefined;
  }

  return Number(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
