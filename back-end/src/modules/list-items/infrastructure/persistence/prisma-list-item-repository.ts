import { Prisma } from "../../../../../generated/prisma/client.ts";
import { prisma } from "../../../../infrastructure/prisma/prisma-client.ts";
import { ResourceNotFoundError } from "../../../auth/application/auth-errors.ts";
import { type Book } from "../../../books/domain/book.ts";
import { type BookList } from "../../../lists/domain/book-list.ts";
import { PrismaBookRepository } from "../../../books/infrastructure/persistence/prisma-book-repository.ts";
import { type ListItemRepository } from "../../application/list-item-service.ts";
import {
  BookAlreadyExistsInListError,
  BookAlreadyExistsInTargetListError,
  ListItemPositionConflictError,
} from "../../application/list-item-errors.ts";
import { type BookListItem, type BookListItemWithBook } from "../../domain/book-list-item.ts";

const bookRepository = new PrismaBookRepository();

export class PrismaListItemRepository implements ListItemRepository {
  async findListById(listId: string): Promise<BookList | null> {
    const list = await prisma.bookList.findUnique({
      where: {
        id: listId,
      },
    });

    return list ? mapBookList(list) : null;
  }

  async findBookById(bookId: string): Promise<Book | null> {
    const book = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
    });

    return book ? mapBook(book) : null;
  }

  async createOrReuseBook(input: { title: string; author: string; cover_url?: string | null }) {
    return bookRepository.createOrReuse(input);
  }

  async findItemById(itemId: string): Promise<BookListItem | null> {
    const item = await prisma.bookListItem.findUnique({
      where: {
        id: itemId,
      },
    });

    return item ? mapBookListItem(item) : null;
  }

  async findItemsByListId(listId: string): Promise<BookListItemWithBook[]> {
    const items = await prisma.bookListItem.findMany({
      where: {
        list_id: listId,
      },
      include: {
        book: true,
      },
      orderBy: {
        position: "asc",
      },
    });

    return items.map((item) => ({
      ...mapBookListItem(item),
      book: mapBook(item.book),
    }));
  }

  async createItem(input: { list_id: string; book_id: string; position?: number }): Promise<BookListItem> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await prisma.$transaction(async (tx) => {
          const existingItem = await tx.bookListItem.findFirst({
            where: {
              list_id: input.list_id,
              book_id: input.book_id,
            },
          });

          if (existingItem) {
            throw new BookAlreadyExistsInListError();
          }

          const totalItems = await tx.bookListItem.count({
            where: {
              list_id: input.list_id,
            },
          });
          const targetPosition = normalizeInsertPosition(input.position, totalItems);

          await tx.bookListItem.updateMany({
            where: {
              list_id: input.list_id,
              position: {
                gte: targetPosition,
              },
            },
            data: {
              position: {
                increment: 1,
              },
            },
          });

          const createdItem = await tx.bookListItem.create({
            data: {
              list_id: input.list_id,
              book_id: input.book_id,
              position: targetPosition,
            },
          });

          return mapBookListItem(createdItem);
        });
      } catch (error: unknown) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        const conflictTarget = readUniqueConstraintTarget(error);

        if (isListBookConflictTarget(conflictTarget)) {
          throw new BookAlreadyExistsInListError();
        }

        if (isListPositionConflictTarget(conflictTarget)) {
          if (attempt < 2) {
            continue;
          }

          throw new ListItemPositionConflictError();
        }

        throw error;
      }
    }

    throw new ListItemPositionConflictError();
  }

  async deleteItem(input: { list_id: string; item_id: string }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const item = await tx.bookListItem.findUnique({
        where: {
          id: input.item_id,
        },
      });

      if (!item || item.list_id !== input.list_id) {
        return;
      }

      await tx.bookListItem.delete({
        where: {
          id: input.item_id,
        },
      });

      await tx.bookListItem.updateMany({
        where: {
          list_id: input.list_id,
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
    });
  }

  async reorderItem(input: { list_id: string; item_id: string; position: number }): Promise<BookListItem> {
    return prisma.$transaction(async (tx) => {
      const item = await tx.bookListItem.findUnique({
        where: {
          id: input.item_id,
        },
      });

      if (!item || item.list_id !== input.list_id) {
        throw new Error("List item not found");
      }

      const totalItems = await tx.bookListItem.count({
        where: {
          list_id: input.list_id,
        },
      });
      const targetPosition = normalizeExistingItemPosition(input.position, totalItems);

      const detachedItem = await tx.bookListItem.updateMany({
        where: {
          id: input.item_id,
          list_id: input.list_id,
        },
        data: {
          position: 0,
        },
      });

      if (detachedItem.count === 0) {
        throw new ResourceNotFoundError();
      }

      if (targetPosition < item.position) {
        await tx.bookListItem.updateMany({
          where: {
            list_id: input.list_id,
            position: {
              gte: targetPosition,
              lt: item.position,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      } else if (targetPosition > item.position) {
        await tx.bookListItem.updateMany({
          where: {
            list_id: input.list_id,
            position: {
              gt: item.position,
              lte: targetPosition,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      }

      const movedItem = await tx.bookListItem.updateMany({
        where: {
          id: input.item_id,
          list_id: input.list_id,
        },
        data: {
          position: targetPosition,
        },
      });

      if (movedItem.count === 0) {
        throw new ResourceNotFoundError();
      }

      const updatedItem = await tx.bookListItem.findUnique({
        where: {
          id: input.item_id,
        },
      });

      if (!updatedItem || updatedItem.list_id !== input.list_id) {
        throw new ResourceNotFoundError();
      }

      return mapBookListItem(updatedItem);
    });
  }

  async moveItem(input: {
    source_list_id: string;
    item_id: string;
    target_list_id: string;
    target_position: number;
  }): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const item = await tx.bookListItem.findUnique({
          where: {
            id: input.item_id,
          },
        });

        if (!item || item.list_id !== input.source_list_id) {
          return;
        }

        if (input.source_list_id === input.target_list_id) {
          await this.reorderInsideTransaction(tx, {
            list_id: input.source_list_id,
            item_id: input.item_id,
            position: input.target_position,
          });
          return;
        }

        const duplicateItem = await tx.bookListItem.findFirst({
          where: {
            list_id: input.target_list_id,
            book_id: item.book_id,
          },
        });

        if (duplicateItem) {
          throw new BookAlreadyExistsInTargetListError();
        }

        await tx.bookListItem.updateMany({
          where: {
            list_id: input.source_list_id,
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

        const targetCount = await tx.bookListItem.count({
          where: {
            list_id: input.target_list_id,
          },
        });
        const targetPosition = normalizeInsertPosition(input.target_position, targetCount);

        await tx.bookListItem.updateMany({
          where: {
            list_id: input.target_list_id,
            position: {
              gte: targetPosition,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });

        const movedItem = await tx.bookListItem.updateMany({
          where: {
            id: input.item_id,
            list_id: input.source_list_id,
          },
          data: {
            list_id: input.target_list_id,
            position: targetPosition,
          },
        });

        if (movedItem.count === 0) {
          throw new ResourceNotFoundError();
        }
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new BookAlreadyExistsInTargetListError();
      }

      throw error;
    }
  }

  private async reorderInsideTransaction(
    tx: Prisma.TransactionClient,
    input: { list_id: string; item_id: string; position: number },
  ) {
    const item = await tx.bookListItem.findUnique({
      where: {
        id: input.item_id,
      },
    });

    if (!item || item.list_id !== input.list_id) {
      return;
    }

    const totalItems = await tx.bookListItem.count({
      where: {
        list_id: input.list_id,
      },
    });
    const targetPosition = normalizeExistingItemPosition(input.position, totalItems);

    const detachedItem = await tx.bookListItem.updateMany({
      where: {
        id: input.item_id,
        list_id: input.list_id,
      },
      data: {
        position: 0,
      },
    });

    if (detachedItem.count === 0) {
      throw new ResourceNotFoundError();
    }

    if (targetPosition < item.position) {
      await tx.bookListItem.updateMany({
        where: {
          list_id: input.list_id,
          position: {
            gte: targetPosition,
            lt: item.position,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
    } else if (targetPosition > item.position) {
      await tx.bookListItem.updateMany({
        where: {
          list_id: input.list_id,
          position: {
            gt: item.position,
            lte: targetPosition,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });
    }

    const movedItem = await tx.bookListItem.updateMany({
      where: {
        id: input.item_id,
        list_id: input.list_id,
      },
      data: {
        position: targetPosition,
      },
    });

    if (movedItem.count === 0) {
      throw new ResourceNotFoundError();
    }
  }
}

function normalizeInsertPosition(position: number | undefined, totalItems: number) {
  if (!position) {
    return totalItems + 1;
  }

  return Math.max(1, Math.min(position, totalItems + 1));
}

function normalizeExistingItemPosition(position: number, totalItems: number) {
  return Math.max(1, Math.min(position, Math.max(totalItems, 1)));
}

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function readUniqueConstraintTarget(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;

  return Array.isArray(target) ? target.filter((value): value is string => typeof value === "string") : [];
}

function isListBookConflictTarget(target: string[]) {
  return target.includes("list_id") && target.includes("book_id");
}

function isListPositionConflictTarget(target: string[]) {
  return target.includes("list_id") && target.includes("position");
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

function mapBookList(list: {
  id: string;
  name: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}): BookList {
  return {
    id: list.id,
    name: list.name,
    user_id: list.user_id,
    created_at: list.created_at.toISOString(),
    updated_at: list.updated_at.toISOString(),
  };
}

function mapBookListItem(item: {
  id: string;
  list_id: string;
  book_id: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}): BookListItem {
  return {
    id: item.id,
    list_id: item.list_id,
    book_id: item.book_id,
    position: item.position,
    created_at: item.created_at.toISOString(),
    updated_at: item.updated_at.toISOString(),
  };
}
