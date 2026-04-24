import { LogService } from "../application/log-service.ts";
import { PrismaLogRepository } from "../infrastructure/persistence/prisma-log-repository.ts";

const logRepository = new PrismaLogRepository();

export const logService = new LogService(logRepository);
