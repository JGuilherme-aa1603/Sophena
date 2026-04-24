export class ListNameConflictError extends Error {
  constructor() {
    super("List name already exists");
  }
}
