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
      user_picture_url: user.user_picture_url,
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
      user_picture_url: user.user_picture_url,
      is_admin: Boolean(user.admin),
    };
  }

  async updateUserPictureUrl(input: {
    userId: string;
    user_picture_url: string | null;
  }): Promise<AuthUser | null> {
    const user = await prisma.user.update({
      where: {
        id: input.userId,
      },
      data: {
        user_picture_url: input.user_picture_url,
      },
      include: {
        admin: true,
      },
    });

    return {
      id: user.id,
      user_name: user.user_name,
      password_hash: user.password_hash,
      user_picture_url: user.user_picture_url,
      is_admin: Boolean(user.admin),
    };
  }
}
