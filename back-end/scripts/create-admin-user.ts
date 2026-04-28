import "dotenv/config";

import { prisma } from "../src/infrastructure/prisma/prisma-client.ts";
import { hashPassword } from "../src/modules/auth/infrastructure/security/password-hasher.ts";

async function main() {
  const userName = process.env.ADMIN_USER_NAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!userName) {
    throw new Error("Defina ADMIN_USER_NAME no ambiente antes de rodar o script.");
  }

  if (!password) {
    throw new Error("Defina ADMIN_PASSWORD no ambiente antes de rodar o script.");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      user_name: userName,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new Error(`Já existe um usuário com user_name=${userName}`);
  }

  const createdUser = await prisma.user.create({
    data: {
      user_name: userName,
      password_hash: hashPassword(password),
      admin: {
        create: {},
      },
    },
    select: {
      id: true,
      user_name: true,
      admin: {
        select: {
          id: true,
        },
      },
    },
  });

  console.log(`Usuário admin criado com sucesso: ${createdUser.user_name}`);
  console.log(`user_id=${createdUser.id}`);
  console.log(`admin_id=${createdUser.admin?.id ?? "não-criado"}`);
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
