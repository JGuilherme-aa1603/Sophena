import { Prisma } from "../../../../../generated/prisma/client.ts";
import { prisma } from "../../../../infrastructure/prisma/prisma-client.ts";
import { hashPassword } from "../../../auth/infrastructure/security/password-hasher.ts";
import { type AdminManagedUser } from "../../domain/admin-user.ts";
import { type AdminUserRepository } from "../../application/admin-user-service.ts";
import { AdminUserNameConflictError } from "../../application/admin-user-errors.ts";

export class PrismaAdminUserRepository implements AdminUserRepository {
  async createUser(input: {
    user_name: string;
    password: string;
    is_admin: boolean;
  }): Promise<AdminManagedUser> {
    try {
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
        created_at: user.created_at.toISOString(),
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AdminUserNameConflictError();
      }

      throw error;
    }
  }
}
