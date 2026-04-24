import { prisma } from "../../../../infrastructure/prisma/prisma-client.ts";
import { type AuthUser } from "../../domain/auth-user.ts";

export class PrismaAuthUserRepository {
  async findByUserName(userName: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: {
        user_name: userName,
      },
      include: {
        admin: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      user_name: user.user_name,
      password_hash: user.password_hash,
      is_admin: Boolean(user.admin),
    };
  }

  async findById(userId: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        admin: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      user_name: user.user_name,
      password_hash: user.password_hash,
      is_admin: Boolean(user.admin),
    };
  }
}
