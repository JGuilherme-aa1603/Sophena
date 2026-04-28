export class BookDeletionConfirmationRequiredError extends Error {
  constructor(public readonly removedFromListsCount: number) {
    super("Book is still used in lists");
  }
}
