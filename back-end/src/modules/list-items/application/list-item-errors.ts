export class BookAlreadyExistsInListError extends Error {
  constructor() {
    super("Book already exists in list");
  }
}

export class BookAlreadyExistsInTargetListError extends Error {
  constructor() {
    super("Book already exists in target list");
  }
}

export class ListItemPositionConflictError extends Error {
  constructor() {
    super("List item position conflict");
  }
}
