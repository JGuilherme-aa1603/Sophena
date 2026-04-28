import "../../integration/support/test-env.ts";

import { createHash } from "node:crypto";

import { prisma } from "../../../src/infrastructure/prisma/prisma-client.ts";
import { hashPassword } from "../../../src/modules/auth/infrastructure/security/password-hasher.ts";

export async function resetDatabase() {
  await prisma.log.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.bookListItem.deleteMany();
  await prisma.bookList.deleteMany();
  await prisma.book.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export async function clearLogs() {
  await prisma.log.deleteMany();
}

export async function createTestUser(input: {
  user_name: string;
  password: string;
  is_admin?: boolean;
}) {
  const user = await prisma.user.create({
    data: {
      user_name: input.user_name,
      password_hash: hashPassword(input.password),
      admin: input.is_admin
        ? {
            create: {},
          }
        : undefined,
    },
    include: {
      admin: true,
    },
  });

  return {
    id: user.id,
    user_name: user.user_name,
    is_admin: Boolean(user.admin),
  };
}

export async function createTestBook(input: {
  title: string;
  author: string;
  cover_url?: string | null;
}) {
  return prisma.book.create({
    data: {
      title: input.title,
      author: input.author,
      cover_url: input.cover_url ?? null,
    },
  });
}

export async function createTestList(input: {
  name: string;
  user_id: string;
}) {
  return prisma.bookList.create({
    data: {
      name: input.name,
      user_id: input.user_id,
    },
  });
}

export async function createTestBookListItem(input: {
  list_id: string;
  book_id: string;
  position: number;
}) {
  return prisma.bookListItem.create({
    data: {
      list_id: input.list_id,
      book_id: input.book_id,
      position: input.position,
    },
  });
}

export async function countBooksByTitleAndAuthor(input: {
  title: string;
  author: string;
}) {
  return prisma.book.count({
    where: {
      title: input.title,
      author: input.author,
    },
  });
}

export async function findBookById(bookId: string) {
  return prisma.book.findUnique({
    where: {
      id: bookId,
    },
  });
}

export async function countBookListItemsByBookId(bookId: string) {
  return prisma.bookListItem.count({
    where: {
      book_id: bookId,
    },
  });
}

export async function findListItemsByListId(listId: string) {
  return prisma.bookListItem.findMany({
    where: {
      list_id: listId,
    },
    orderBy: {
      position: "asc",
    },
  });
}

export async function findRefreshTokensByUserId(userId: string) {
  return prisma.refreshToken.findMany({
    where: {
      user_id: userId,
    },
    orderBy: {
      created_at: "asc",
    },
  });
}

export async function expireRefreshToken(rawToken: string) {
  await prisma.refreshToken.update({
    where: {
      token_hash: sha256(rawToken),
    },
    data: {
      expires_at: new Date(Date.now() - 60_000),
    },
  });
}

export async function findUserWithAdminByUserName(userName: string) {
  return prisma.user.findUnique({
    where: {
      user_name: userName,
    },
    include: {
      admin: true,
    },
  });
}

export async function createTestLog(input: {
  level: "INFO" | "WARN" | "ERROR";
  status_code: number;
  message?: string | null;
  route?: string | null;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | null;
  user_id?: string | null;
  created_at?: Date;
}) {
  return prisma.log.create({
    data: {
      level: input.level,
      status_code: input.status_code,
      message: input.message ?? null,
      route: input.route ?? null,
      method: input.method ?? null,
      user_id: input.user_id ?? null,
      created_at: input.created_at,
    },
  });
}

export async function findLogs(input?: {
  route?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  level?: "INFO" | "WARN" | "ERROR";
  user_id?: string | null;
}) {
  return prisma.log.findMany({
    where: {
      route: input?.route,
      method: input?.method,
      level: input?.level,
      user_id: input?.user_id,
    },
    orderBy: {
      created_at: "asc",
    },
  });
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
