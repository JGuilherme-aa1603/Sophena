export class AdminUserNameConflictError extends Error {
  constructor() {
    super("User name already exists");
  }
}
