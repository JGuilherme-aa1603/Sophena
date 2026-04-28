import "dotenv/config";

import { prisma } from "../src/infrastructure/prisma/prisma-client.ts";
import { hashPassword } from "../src/modules/auth/infrastructure/security/password-hasher.ts";

async function main() {
  const userName = process.env.USER_NAME_TO_RESET;
  const newPassword = process.env.NEW_PASSWORD;

  if (!userName) {
    throw new Error("Defina USER_NAME_TO_RESET no ambiente antes de rodar o script.");
  }

  if (!newPassword) {
    throw new Error("Defina NEW_PASSWORD no ambiente antes de rodar o script.");
  }

  const user = await prisma.user.findUnique({
    where: {
      user_name: userName,
    },
    select: {
      id: true,
      user_name: true,
    },
  });

  if (!user) {
    throw new Error(`Usuário não encontrado: ${userName}`);
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password_hash: hashPassword(newPassword),
    },
  });

  console.log(`Senha redefinida com sucesso para o usuário: ${user.user_name}`);
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
