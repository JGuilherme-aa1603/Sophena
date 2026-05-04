import { prisma } from "../../../../infrastructure/prisma/prisma-client.ts";
import { type BookList } from "../../domain/book-list.ts";
import { type ListRepository } from "../../application/list-service.ts";

const PREVIEW_INCLUDE = {
  items: {
    take: 5,
    orderBy: { position: "asc" as const },
    include: {
      book: {
        select: { id: true, title: true, author: true, cover_url: true },
      },
    },
  },
} as const;

type PrismaList = {
  id: string;
  name: string;
  icon: string;
  tint_index: number;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  items: Array<{
    book: { id: string; title: string; author: string; cover_url: string | null };
  }>;
};

function mapBookList(list: PrismaList): BookList {
  return {
    id: list.id,
    name: list.name,
    icon: list.icon,
    tint_index: list.tint_index,
    user_id: list.user_id,
    created_at: list.created_at.toISOString(),
    updated_at: list.updated_at.toISOString(),
    preview_items: list.items.map((item) => ({
      id: item.book.id,
      title: item.book.title,
      author: item.book.author,
      cover_url: item.book.cover_url,
    })),
  };
}

export class PrismaListRepository implements ListRepository {
  async findAllByUserId(userId: string): Promise<BookList[]> {
    const lists = await prisma.bookList.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "asc" },
      include: PREVIEW_INCLUDE,
    });

    return lists.map(mapBookList);
  }

  async findById(listId: string): Promise<BookList | null> {
    const list = await prisma.bookList.findUnique({
      where: { id: listId },
      include: PREVIEW_INCLUDE,
    });

    return list ? mapBookList(list) : null;
  }

  async findByUserIdAndName(userId: string, name: string): Promise<BookList | null> {
    const list = await prisma.bookList.findFirst({
      where: { user_id: userId, name },
      include: PREVIEW_INCLUDE,
    });

    return list ? mapBookList(list) : null;
  }

  async create(input: {
    name: string;
    user_id: string;
    icon: string;
    tint_index: number;
  }): Promise<BookList> {
    const list = await prisma.bookList.create({
      data: {
        name: input.name,
        user_id: input.user_id,
        icon: input.icon,
        tint_index: input.tint_index,
      },
      include: PREVIEW_INCLUDE,
    });

    return mapBookList(list);
  }

  async updateName(listId: string, name: string): Promise<BookList> {
    const list = await prisma.bookList.update({
      where: { id: listId },
      data: { name },
      include: PREVIEW_INCLUDE,
    });

    return mapBookList(list);
  }

  async updateMeta(listId: string, input: { icon: string; tint_index: number }): Promise<BookList> {
    const list = await prisma.bookList.update({
      where: { id: listId },
      data: { icon: input.icon, tint_index: input.tint_index },
      include: PREVIEW_INCLUDE,
    });

    return mapBookList(list);
  }

  async delete(listId: string): Promise<void> {
    await prisma.bookList.delete({ where: { id: listId } });
  }
}
