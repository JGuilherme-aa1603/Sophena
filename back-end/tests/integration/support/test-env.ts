process.env.SOPHENA_RUNTIME_MODE = "test";

if (!process.env.DATABASE_URL_TEST) {
  throw new Error("DATABASE_URL_TEST is required for automated tests");
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL === process.env.DATABASE_URL_TEST) {
  throw new Error("DATABASE_URL_TEST must be different from DATABASE_URL");
}

if (!process.env.ACCESS_TOKEN_SECRET) {
  process.env.ACCESS_TOKEN_SECRET = "test-access-secret";
}

if (!process.env.REFRESH_TOKEN_SECRET) {
  process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
}

if (!process.env.AUTH_RATE_LIMIT_WINDOW_MS) {
  process.env.AUTH_RATE_LIMIT_WINDOW_MS = "60000";
}

if (!process.env.AUTH_LOGIN_RATE_LIMIT_MAX) {
  process.env.AUTH_LOGIN_RATE_LIMIT_MAX = "1000";
}

if (!process.env.AUTH_REFRESH_RATE_LIMIT_MAX) {
  process.env.AUTH_REFRESH_RATE_LIMIT_MAX = "1000";
}
