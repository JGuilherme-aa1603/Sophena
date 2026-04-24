import { ListService } from "../application/list-service.ts";
import { PrismaListRepository } from "../infrastructure/persistence/prisma-list-repository.ts";

const listRepository = new PrismaListRepository();

export const listService = new ListService(listRepository);
