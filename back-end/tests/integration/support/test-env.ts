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
