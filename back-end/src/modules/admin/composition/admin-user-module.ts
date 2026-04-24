import { AdminUserService } from "../application/admin-user-service.ts";
import { PrismaAdminUserRepository } from "../infrastructure/persistence/prisma-admin-user-repository.ts";

const adminUserRepository = new PrismaAdminUserRepository();

export const adminUserService = new AdminUserService(adminUserRepository);
