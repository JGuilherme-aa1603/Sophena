import { prisma } from "../../../../infrastructure/prisma/prisma-client.ts";
import { type BookList } from "../../domain/book-list.ts";
import { type ListRepository } from "../../application/list-service.ts";

export class PrismaListRepository implements ListRepository {
  async findAllByUserId(userId: string): Promise<BookList[]> {
    const lists = await prisma.bookList.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return lists.map(mapBookList);
  }

  async findById(listId: string): Promise<BookList | null> {
    const list = await prisma.bookList.findUnique({
      where: {
        id: listId,
      },
    });

    return list ? mapBookList(list) : null;
  }

  async findByUserIdAndName(userId: string, name: string): Promise<BookList | null> {
    const list = await prisma.bookList.findFirst({
      where: {
        user_id: userId,
        name,
      },
    });

    return list ? mapBookList(list) : null;
  }

  async create(input: { name: string; user_id: string }): Promise<BookList> {
    const list = await prisma.bookList.create({
      data: {
        name: input.name,
        user_id: input.user_id,
      },
    });

    return mapBookList(list);
  }

  async updateName(listId: string, name: string): Promise<BookList> {
    const list = await prisma.bookList.update({
      where: {
        id: listId,
      },
      data: {
        name,
      },
    });

    return mapBookList(list);
  }

  async delete(listId: string): Promise<void> {
    await prisma.bookList.delete({
      where: {
        id: listId,
      },
    });
  }
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
