import { ResourceNotFoundError, ValidationError } from "../../auth/application/auth-errors.ts";
import { type AuthenticatedUserView } from "../../auth/domain/auth-user.ts";
import { type BookList, toBookListView } from "../domain/book-list.ts";
import { ListNameConflictError } from "./list-errors.ts";

const VALID_ICONS = [
  "bookmark", "heart", "star", "feather", "coffee",
  "moon", "leaf", "flame", "flag", "archive",
] as const;

export type ListRepository = {
  findAllByUserId(userId: string): Promise<BookList[]>;
  findById(listId: string): Promise<BookList | null>;
  findByUserIdAndName(userId: string, name: string): Promise<BookList | null>;
  create(input: { name: string; user_id: string; icon: string; tint_index: number }): Promise<BookList>;
  updateName(listId: string, name: string): Promise<BookList>;
  updateMeta(listId: string, input: { icon: string; tint_index: number }): Promise<BookList>;
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
    input: { name?: unknown; icon?: unknown; tint_index?: unknown },
  ) {
    const parsedInput = validateListInput(input);
    await ensureUniqueListName(
      this.listRepository,
      authenticatedUser.id,
      parsedInput.name,
    );

    const list = await this.listRepository.create({
      name: parsedInput.name,
      icon: parsedInput.icon,
      tint_index: parsedInput.tint_index,
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

  async updateListMeta(
    authenticatedUser: AuthenticatedUserView,
    listId: string,
    input: { icon?: unknown; tint_index?: unknown },
  ) {
    const existingList = await this.getOwnedListOrFail(authenticatedUser.id, listId);
    const parsedMeta = validateMetaInput(input);

    const updatedList = await this.listRepository.updateMeta(existingList.id, parsedMeta);
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

function validateListInput(input: { name?: unknown; icon?: unknown; tint_index?: unknown }) {
  const errors: Array<{ field: string; message: string }> = [];
  const name = typeof input.name === "string" ? input.name : null;

  if (!name || name.trim().length === 0) {
    errors.push({ field: "name", message: "name must be a string" });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  const rawIcon = typeof input.icon === "string" ? input.icon : "bookmark";
  const icon = (VALID_ICONS as readonly string[]).includes(rawIcon) ? rawIcon : "bookmark";

  const rawTint = typeof input.tint_index === "number" ? input.tint_index : 0;
  const tint_index = Number.isInteger(rawTint) && rawTint >= 0 && rawTint <= 5 ? rawTint : 0;

  return {
    name: name!.trim(),
    icon,
    tint_index,
  };
}

function validateMetaInput(input: { icon?: unknown; tint_index?: unknown }) {
  const rawIcon = typeof input.icon === "string" ? input.icon : "bookmark";
  const icon = (VALID_ICONS as readonly string[]).includes(rawIcon) ? rawIcon : "bookmark";

  const rawTint = typeof input.tint_index === "number" ? input.tint_index : 0;
  const tint_index = Number.isInteger(rawTint) && rawTint >= 0 && rawTint <= 5 ? rawTint : 0;

  return { icon, tint_index };
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
