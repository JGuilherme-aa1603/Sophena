import { Prisma } from "../../../../../generated/prisma/client.ts";
import { prisma } from "../../../../infrastructure/prisma/prisma-client.ts";
import { type Book } from "../../domain/book.ts";
import { type BookFilters, type BookRepository } from "../../application/book-service.ts";

export class PrismaBookRepository implements BookRepository {
  async findAll(filters: BookFilters = {}): Promise<Book[]> {
    const books = await prisma.book.findMany({
      where: buildBookWhere(filters),
      orderBy: [
        { title: "asc" },
        { author: "asc" },
      ],
    });

    return books.map(mapBook);
  }

  async findById(bookId: string): Promise<Book | null> {
    const book = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
    });

    return book ? mapBook(book) : null;
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

  async deleteBookAndRemoveListReferencesPreview(bookId: string) {
    const removedFromListsCount = await prisma.bookListItem.count({
      where: {
        book_id: bookId,
      },
    });

    return {
      removed_from_lists_count: removedFromListsCount,
    };
  }

  async deleteBookAndRemoveListReferences(bookId: string): Promise<{ removed_from_lists_count: number }> {
    const listItems = await prisma.bookListItem.findMany({
      where: {
        book_id: bookId,
      },
      orderBy: [
        { list_id: "asc" },
        { position: "asc" },
      ],
    });

    await prisma.$transaction(async (tx) => {
      for (const item of listItems) {
        await tx.bookListItem.delete({
          where: {
            id: item.id,
          },
        });

        await tx.bookListItem.updateMany({
          where: {
            list_id: item.list_id,
            position: {
              gt: item.position,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      }

      await tx.book.delete({
        where: {
          id: bookId,
        },
      });
    });

    return {
      removed_from_lists_count: listItems.length,
    };
  }
}

function buildBookWhere(filters: BookFilters): Prisma.BookWhereInput | undefined {
  const conditions: Prisma.BookWhereInput[] = [];

  if (filters.search) {
    conditions.push({
      OR: [
        {
          title: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          author: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (filters.author) {
    conditions.push({
      author: {
        contains: filters.author,
        mode: "insensitive",
      },
    });
  }

  if (filters.cover === "with") {
    conditions.push({
      cover_url: {
        notIn: [""],
        not: null,
      },
    });
  }

  if (filters.cover === "without") {
    conditions.push({
      OR: [
        { cover_url: null },
        { cover_url: "" },
      ],
    });
  }

  return conditions.length > 0 ? { AND: conditions } : undefined;
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
