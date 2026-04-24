import { Prisma } from "../../../../../generated/prisma/client.ts";
import { prisma } from "../../../../infrastructure/prisma/prisma-client.ts";
import { type Book } from "../../domain/book.ts";
import { type BookRepository } from "../../application/book-service.ts";

export class PrismaBookRepository implements BookRepository {
  async findAll(search?: string): Promise<Book[]> {
    const books = await prisma.book.findMany({
      where: search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                author: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : undefined,
      orderBy: [
        { title: "asc" },
        { author: "asc" },
      ],
    });

    return books.map(mapBook);
  }

  async findByTitleAndAuthor(input: { title: string; author: string }): Promise<Book | null> {
    const book = await prisma.book.findFirst({
      where: {
        title: input.title,
        author: input.author,
      },
    });

    return book ? mapBook(book) : null;
  }

  async createOrReuse(input: { title: string; author: string; cover_url?: string | null }): Promise<Book> {
    try {
      const book = await prisma.book.create({
        data: {
          title: input.title,
          author: input.author,
          cover_url: input.cover_url ?? null,
        },
      });

      return mapBook(book);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existingBook = await this.findByTitleAndAuthor({
          title: input.title,
          author: input.author,
        });

        if (existingBook) {
          return existingBook;
        }
      }

      throw error;
    }
  }
}

function mapBook(book: {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
}): Book {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    cover_url: book.cover_url,
  };
}
