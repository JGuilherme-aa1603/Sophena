import { ListItemService } from "../application/list-item-service.ts";
import { PrismaListItemRepository } from "../infrastructure/persistence/prisma-list-item-repository.ts";

const listItemRepository = new PrismaListItemRepository();

export const listItemService = new ListItemService(listItemRepository);
