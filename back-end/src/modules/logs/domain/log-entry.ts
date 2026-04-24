export type LogLevel = "INFO" | "WARN" | "ERROR";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type LogEntry = {
  id: string;
  level: LogLevel;
  status_code: number;
  message: string | null;
  route: string | null;
  method: HttpMethod | null;
  user_id: string | null;
  created_at: string;
};

export function toLogEntryView(log: LogEntry) {
  return {
    id: log.id,
    level: log.level,
    status_code: log.status_code,
    message: log.message,
    route: log.route,
    method: log.method,
    user_id: log.user_id,
    created_at: log.created_at,
  };
}
