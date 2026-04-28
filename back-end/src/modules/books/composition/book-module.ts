import { BookService, type BookCoverStorage } from "../application/book-service.ts";
import { PrismaBookRepository } from "../infrastructure/persistence/prisma-book-repository.ts";
import { getBookCoverObjectStorage } from "../../uploads/composition/upload-module.ts";

const bookRepository = new PrismaBookRepository();

export function createBookService(dependencies: {
  bookCoverStorage?: BookCoverStorage;
} = {}) {
  return new BookService(
    bookRepository,
    dependencies.bookCoverStorage ?? getBookCoverObjectStorage(),
  );
}

export const bookService = createBookService();
