export class ValidationError extends Error {
  constructor(
    public readonly errors: Array<{ field: string; message: string }>,
  ) {
    super("Validation failed");
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Authentication required");
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
  }
}

export class ResourceNotFoundError extends Error {
  constructor() {
    super("Resource not found");
  }
}
