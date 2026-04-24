import "../../integration/support/test-env.ts";

import { createHash } from "node:crypto";

import { prisma } from "../../../src/infrastructure/prisma/prisma-client.ts";
import { hashPassword } from "../../../src/modules/auth/infrastructure/security/password-hasher.ts";

export async function resetDatabase() {
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

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
