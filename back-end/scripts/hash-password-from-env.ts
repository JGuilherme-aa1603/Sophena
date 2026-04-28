import "dotenv/config";

import { hashPassword } from "../src/modules/auth/infrastructure/security/password-hasher.ts";

try {
  const password = process.env.PASSWORD_TO_HASH;

  if (!password) {
    throw new Error("Defina PASSWORD_TO_HASH no ambiente antes de rodar o script.");
  }

  const passwordHash = hashPassword(password);
  console.log(passwordHash);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exit(1);
}
