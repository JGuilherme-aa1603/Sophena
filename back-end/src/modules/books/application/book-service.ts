import {
  ResourceNotFoundError,
  ValidationError,
} from "../../auth/application/auth-errors.ts";
import { type Book, toBookView } from "../domain/book.ts";
import { BookDeletionConfirmationRequiredError } from "./book-errors.ts";
import { parseManagedBookCoverUrl } from "./book-cover-url.ts";

export type BookRepository = {
  findAll(filters?: BookFilters): Promise<Book[]>;
  findById(bookId: string): Promise<Book | null>;
  findByTitleAndAuthor(input: { title: string; author: string }): Promise<Book | null>;
  createOrReuse(input: { title: string; author: string; cover_url?: string | null }): Promise<Book>;
  deleteBookAndRemoveListReferencesPreview(bookId: string): Promise<{ removed_from_lists_count: number }>;
  deleteBookAndRemoveListReferences(bookId: string): Promise<{ removed_from_lists_count: number }>;
};

export type BookCoverStorage = {
  deleteObjectByUrl(url: string): Promise<void>;
};

type CreateBookInput = {
  title?: unknown;
  author?: unknown;
  cover_url?: unknown;
};

export type BookCoverFilter = "with" | "without";

export type BookFilters = {
  search?: string;
  author?: string;
  cover?: BookCoverFilter;
};

export class BookService {
  constructor(
    private readonly bookRepository: BookRepository,
    private readonly bookCoverStorage: BookCoverStorage,
  ) {}

  async readBooks(input: { search?: unknown; author?: unknown; cover?: unknown }) {
    const search = typeof input.search === "string" && input.search.trim().length > 0
      ? input.search.trim()
      : undefined;
    const author = typeof input.author === "string" && input.author.trim().length > 0
      ? input.author.trim()
      : undefined;
    const cover = parseCoverFilter(input.cover);

    const books = await this.bookRepository.findAll({
      search,
      author,
      cover,
    });

    return {
      items: books.map(toBookView),
    };
  }

  async createBook(input: CreateBookInput) {
    const parsedInput = validateCreateBookInput(input);
    const createdBook = await this.bookRepository.createOrReuse(parsedInput);
    return toBookView(createdBook);
  }

  async deleteBook(input: { bookId?: unknown; force?: unknown }) {
    const bookId = typeof input.bookId === "string" ? input.bookId : "";
    const force = input.force === true || input.force === "true";

    if (!bookId) {
      throw new ResourceNotFoundError();
    }

    const existingBook = await this.bookRepository.findById(bookId);

    if (!existingBook) {
      throw new ResourceNotFoundError();
    }

    const removedFromListsCount = await this.countListReferences(existingBook.id);

    if (removedFromListsCount > 0 && !force) {
      throw new BookDeletionConfirmationRequiredError(removedFromListsCount);
    }

    if (existingBook.cover_url) {
      await this.bookCoverStorage.deleteObjectByUrl(existingBook.cover_url);
    }

    return this.bookRepository.deleteBookAndRemoveListReferences(existingBook.id);
  }

  private async countListReferences(bookId: string) {
    const deletionPreview = await this.bookRepository.deleteBookAndRemoveListReferencesPreview(bookId);
    return deletionPreview.removed_from_lists_count;
  }
}

function parseCoverFilter(cover: unknown): BookCoverFilter | undefined {
  if (cover === undefined || cover === null || cover === "") {
    return undefined;
  }

  if (cover === "with" || cover === "without") {
    return cover;
  }

  throw new ValidationError([
    { field: "cover", message: "cover must be with or without" },
  ]);
}

function validateCreateBookInput(input: CreateBookInput) {
  const errors: Array<{ field: string; message: string }> = [];
  const title = typeof input.title === "string" ? input.title : null;
  const author = typeof input.author === "string" ? input.author : null;
  const coverUrl = parseManagedBookCoverUrl(input.cover_url, errors);

  if (!title || title.trim().length === 0) {
    errors.push({ field: "title", message: "title must be a string" });
  }

  if (!author || author.trim().length === 0) {
    errors.push({ field: "author", message: "author must be a string" });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    title: title!.trim(),
    author: author!.trim(),
    cover_url: coverUrl,
  };
}
