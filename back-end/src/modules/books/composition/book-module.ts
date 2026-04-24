import { BookService } from "../application/book-service.ts";
import { PrismaBookRepository } from "../infrastructure/persistence/prisma-book-repository.ts";

const bookRepository = new PrismaBookRepository();

export const bookService = new BookService(bookRepository);
