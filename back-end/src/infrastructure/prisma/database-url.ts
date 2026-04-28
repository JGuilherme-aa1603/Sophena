export type RuntimeMode = "app" | "test";

export function resolveDatabaseUrlForRuntime(
  mode: RuntimeMode,
  environment: NodeJS.ProcessEnv = process.env,
) {
  if (mode === "test") {
    return readTestDatabaseUrl(environment);
  }

  return readRequiredDatabaseUrl(environment);
}

function readRequiredDatabaseUrl(environment: NodeJS.ProcessEnv) {
  const databaseUrl = environment.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return databaseUrl;
}

function readTestDatabaseUrl(environment: NodeJS.ProcessEnv) {
  const databaseUrl = environment.DATABASE_URL;
  const testDatabaseUrl = environment.DATABASE_URL_TEST;

  if (!testDatabaseUrl) {
    throw new Error("DATABASE_URL_TEST is required for automated tests");
  }

  if (databaseUrl && databaseUrl === testDatabaseUrl) {
    throw new Error("DATABASE_URL_TEST must be different from DATABASE_URL");
  }

  return testDatabaseUrl;
}
