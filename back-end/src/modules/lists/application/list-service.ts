import { ResourceNotFoundError, ValidationError } from "../../auth/application/auth-errors.ts";
import { type AuthenticatedUserView } from "../../auth/domain/auth-user.ts";
import { type BookList, toBookListView } from "../domain/book-list.ts";
import { ListNameConflictError } from "./list-errors.ts";

export type ListRepository = {
  findAllByUserId(userId: string): Promise<BookList[]>;
  findById(listId: string): Promise<BookList | null>;
  findByUserIdAndName(userId: string, name: string): Promise<BookList | null>;
  create(input: { name: string; user_id: string }): Promise<BookList>;
  updateName(listId: string, name: string): Promise<BookList>;
  delete(listId: string): Promise<void>;
};

export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async readLists(authenticatedUser: AuthenticatedUserView) {
    const lists = await this.listRepository.findAllByUserId(authenticatedUser.id);
    return {
      items: lists.map(toBookListView),
    };
  }

  async createList(
    authenticatedUser: AuthenticatedUserView,
    input: { name?: unknown },
  ) {
    const parsedInput = validateListInput(input);
    await ensureUniqueListName(
      this.listRepository,
      authenticatedUser.id,
      parsedInput.name,
    );

    const list = await this.listRepository.create({
      name: parsedInput.name,
      user_id: authenticatedUser.id,
    });

    return toBookListView(list);
  }

  async updateListName(
    authenticatedUser: AuthenticatedUserView,
    listId: string,
    input: { name?: unknown },
  ) {
    const parsedInput = validateListInput(input);
    const existingList = await this.getOwnedListOrFail(authenticatedUser.id, listId);

    const duplicateList = await this.listRepository.findByUserIdAndName(
      authenticatedUser.id,
      parsedInput.name,
    );

    if (duplicateList && duplicateList.id !== existingList.id) {
      throw new ListNameConflictError();
    }

    const updatedList = await this.listRepository.updateName(existingList.id, parsedInput.name);
    return toBookListView(updatedList);
  }

  async deleteList(
    authenticatedUser: AuthenticatedUserView,
    listId: string,
  ) {
    const existingList = await this.getOwnedListOrFail(authenticatedUser.id, listId);
    await this.listRepository.delete(existingList.id);

    return {
      message: "List deleted successfully",
    };
  }

  private async getOwnedListOrFail(userId: string, listId: string) {
    const list = await this.listRepository.findById(listId);

    if (!list || list.user_id !== userId) {
      throw new ResourceNotFoundError();
    }

    return list;
  }
}

function validateListInput(input: { name?: unknown }) {
  const errors: Array<{ field: string; message: string }> = [];
  const name = typeof input.name === "string" ? input.name : null;

  if (!name || name.trim().length === 0) {
    errors.push({ field: "name", message: "name must be a string" });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    name: name!.trim(),
  };
}

async function ensureUniqueListName(
  listRepository: ListRepository,
  userId: string,
  name: string,
) {
  const existingList = await listRepository.findByUserIdAndName(userId, name);

  if (existingList) {
    throw new ListNameConflictError();
  }
}
