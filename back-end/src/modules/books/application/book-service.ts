import { ValidationError } from "../../auth/application/auth-errors.ts";
import { type Book, toBookView } from "../domain/book.ts";

export type BookRepository = {
  findAll(search?: string): Promise<Book[]>;
  findByTitleAndAuthor(input: { title: string; author: string }): Promise<Book | null>;
  createOrReuse(input: { title: string; author: string; cover_url?: string | null }): Promise<Book>;
};

type CreateBookInput = {
  title?: unknown;
  author?: unknown;
  cover_url?: unknown;
};

export class BookService {
  constructor(private readonly bookRepository: BookRepository) {}

  async readBooks(input: { search?: unknown }) {
    const search = typeof input.search === "string" && input.search.trim().length > 0
      ? input.search.trim()
      : undefined;

    const books = await this.bookRepository.findAll(search);

    return {
      items: books.map(toBookView),
    };
  }

  async createBook(input: CreateBookInput) {
    const parsedInput = validateCreateBookInput(input);
    const createdBook = await this.bookRepository.createOrReuse(parsedInput);
    return toBookView(createdBook);
  }
}

function validateCreateBookInput(input: CreateBookInput) {
  const errors: Array<{ field: string; message: string }> = [];
  const title = typeof input.title === "string" ? input.title : null;
  const author = typeof input.author === "string" ? input.author : null;
  const coverUrl = input.cover_url;

  if (!title || title.trim().length === 0) {
    errors.push({ field: "title", message: "title must be a string" });
  }

  if (!author || author.trim().length === 0) {
    errors.push({ field: "author", message: "author must be a string" });
  }

  if (
    coverUrl !== undefined &&
    coverUrl !== null &&
    typeof coverUrl !== "string"
  ) {
    errors.push({ field: "cover_url", message: "cover_url must be a string, null, or undefined" });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    title: title!.trim(),
    author: author!.trim(),
    cover_url: typeof coverUrl === "string" ? coverUrl : null,
  };
}
