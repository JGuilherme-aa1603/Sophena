import { ValidationError } from "../../auth/application/auth-errors.ts";
import { type HttpMethod, type LogEntry, type LogLevel, toLogEntryView } from "../domain/log-entry.ts";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const STRICT_ISO_8601_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export type LogRepository = {
  create(input: {
    level: LogLevel;
    status_code: number;
    message?: string | null;
    route?: string | null;
    method?: HttpMethod | null;
    user_id?: string | null;
  }): Promise<void>;
  findMany(input: {
    page: number;
    limit: number;
    level?: LogLevel;
    method?: HttpMethod;
    status_code?: number;
    from?: Date;
    to?: Date;
  }): Promise<{ items: LogEntry[]; total: number }>;
  countByLevel(): Promise<{ info: number; warn: number; error: number }>;
};

type ReadLogsInput = {
  page?: unknown;
  limit?: unknown;
  level?: unknown;
  method?: unknown;
  status_code?: unknown;
  from?: unknown;
  to?: unknown;
};

export class LogService {
  constructor(private readonly logRepository: LogRepository) {}

  async createLog(input: {
    level: LogLevel;
    status_code: number;
    message?: string | null;
    route?: string | null;
    method?: HttpMethod | null;
    user_id?: string | null;
  }) {
    await this.logRepository.create({
      ...input,
      message: sanitizeMessage(input.message ?? null),
    });
  }

  async readLogs(input: ReadLogsInput) {
    const parsedInput = validateReadLogsInput(input);
    const result = await this.logRepository.findMany(parsedInput);

    return {
      items: result.items.map(toLogEntryView),
      pagination: {
        page: parsedInput.page,
        limit: parsedInput.limit,
        total: result.total,
      },
    };
  }

  async summarizeLogs() {
    const counts = await this.logRepository.countByLevel();

    return {
      success_count: counts.info,
      warn_count: counts.warn,
      error_count: counts.error,
    };
  }
}

function validateReadLogsInput(input: ReadLogsInput) {
  const errors: Array<{ field: string; message: string }> = [];
  const page = parsePositiveInteger(input.page, "page", DEFAULT_PAGE, errors);
  const limit = parseLimit(input.limit, errors);
  const level = parseOptionalLevel(input.level, errors);
  const method = parseOptionalMethod(input.method, errors);
  const status_code = parseOptionalStatusCode(input.status_code, errors);
  const from = parseOptionalDate(input.from, "from", errors);
  const to = parseOptionalDate(input.to, "to", errors);

  if (from && to && from.getTime() > to.getTime()) {
    errors.push({
      field: "from",
      message: "from must be less than or equal to to",
    });
    errors.push({
      field: "to",
      message: "to must be greater than or equal to from",
    });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    page,
    limit,
    level,
    method,
    status_code,
    from,
    to,
  };
}

function parsePositiveInteger(
  value: unknown,
  field: string,
  defaultValue: number,
  errors: Array<{ field: string; message: string }>,
) {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value) || Number(value) <= 0) {
    errors.push({
      field,
      message: `${field} must be a positive integer`,
    });
    return defaultValue;
  }

  return Number(value);
}

function parseLimit(
  value: unknown,
  errors: Array<{ field: string; message: string }>,
) {
  const parsedLimit = parsePositiveInteger(value, "limit", DEFAULT_LIMIT, errors);

  if (value !== undefined && parsedLimit > MAX_LIMIT) {
    errors.push({
      field: "limit",
      message: `limit must be less than or equal to ${MAX_LIMIT}`,
    });
  }

  return parsedLimit;
}

function parseOptionalLevel(
  value: unknown,
  errors: Array<{ field: string; message: string }>,
): LogLevel | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === "INFO" || value === "WARN" || value === "ERROR") {
    return value;
  }

  errors.push({
    field: "level",
    message: "level must be INFO, WARN, or ERROR",
  });
  return undefined;
}

function parseOptionalMethod(
  value: unknown,
  errors: Array<{ field: string; message: string }>,
): HttpMethod | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === "GET" || value === "POST" || value === "PUT" || value === "PATCH" || value === "DELETE") {
    return value;
  }

  errors.push({
    field: "method",
    message: "method must be GET, POST, PUT, PATCH, or DELETE",
  });
  return undefined;
}

function parseOptionalStatusCode(
  value: unknown,
  errors: Array<{ field: string; message: string }>,
) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsedStatusCode = Number(value);

    if (parsedStatusCode > 0) {
      return parsedStatusCode;
    }
  }

  errors.push({
    field: "status_code",
    message: "status_code must be a positive integer",
  });
  return undefined;
}

function parseOptionalDate(
  value: unknown,
  field: "from" | "to",
  errors: Array<{ field: string; message: string }>,
) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    errors.push({
      field,
      message: `${field} must be a valid ISO date`,
    });
    return undefined;
  }

  if (!STRICT_ISO_8601_UTC_PATTERN.test(value)) {
    errors.push({
      field,
      message: `${field} must be a valid ISO date`,
    });
    return undefined;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    errors.push({
      field,
      message: `${field} must be a valid ISO date`,
    });
    return undefined;
  }

  return parsedDate;
}

function sanitizeMessage(message: string | null) {
  if (!message) {
    return null;
  }

  return message
    .replace(/password_hash/gi, "[redacted]")
    .replace(/refresh_token=[^;\s]+/gi, "[redacted]")
    .replace(/refresh_token/gi, "[redacted]");
}
