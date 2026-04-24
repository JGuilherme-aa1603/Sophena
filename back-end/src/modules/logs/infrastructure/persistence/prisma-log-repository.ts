import { prisma } from "../../../../infrastructure/prisma/prisma-client.ts";
import { type LogRepository } from "../../application/log-service.ts";
import { type HttpMethod, type LogEntry, type LogLevel } from "../../domain/log-entry.ts";

export class PrismaLogRepository implements LogRepository {
  async create(input: {
    level: LogLevel;
    status_code: number;
    message?: string | null;
    route?: string | null;
    method?: HttpMethod | null;
    user_id?: string | null;
  }): Promise<void> {
    await prisma.log.create({
      data: {
        level: input.level,
        status_code: input.status_code,
        message: input.message ?? null,
        route: input.route ?? null,
        method: input.method ?? null,
        user_id: input.user_id ?? null,
      },
    });
  }

  async findMany(input: {
    page: number;
    limit: number;
    level?: LogLevel;
    method?: HttpMethod;
    status_code?: number;
    from?: Date;
    to?: Date;
  }): Promise<{ items: LogEntry[]; total: number }> {
    const where = {
      level: input.level,
      method: input.method,
      status_code: input.status_code,
      created_at: input.from || input.to
        ? {
            gte: input.from,
            lte: input.to,
          }
        : undefined,
    };

    const [total, logs] = await Promise.all([
      prisma.log.count({ where }),
      prisma.log.findMany({
        where,
        orderBy: [
          { created_at: "desc" },
          { id: "desc" },
        ],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
    ]);

    return {
      total,
      items: logs.map(mapLogEntry),
    };
  }

  async countByLevel() {
    const [info, warn, error] = await Promise.all([
      prisma.log.count({ where: { level: "INFO" } }),
      prisma.log.count({ where: { level: "WARN" } }),
      prisma.log.count({ where: { level: "ERROR" } }),
    ]);

    return {
      info,
      warn,
      error,
    };
  }
}

function mapLogEntry(log: {
  id: string;
  level: LogLevel;
  status_code: number;
  message: string | null;
  route: string | null;
  method: HttpMethod | null;
  user_id: string | null;
  created_at: Date;
}): LogEntry {
  return {
    id: log.id,
    level: log.level,
    status_code: log.status_code,
    message: log.message,
    route: log.route,
    method: log.method,
    user_id: log.user_id,
    created_at: log.created_at.toISOString(),
  };
}
