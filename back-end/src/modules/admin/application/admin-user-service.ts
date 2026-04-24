import { ValidationError } from "../../auth/application/auth-errors.ts";
import { type AdminManagedUser, toAdminManagedUserView } from "../domain/admin-user.ts";
import { AdminUserNameConflictError } from "./admin-user-errors.ts";

export type AdminUserRepository = {
  createUser(input: {
    user_name: string;
    password: string;
    is_admin: boolean;
  }): Promise<AdminManagedUser>;
};

type CreateAdminUserInput = {
  user_name?: unknown;
  password?: unknown;
  is_admin?: unknown;
};

export class AdminUserService {
  constructor(private readonly adminUserRepository: AdminUserRepository) {}

  async createUser(input: CreateAdminUserInput) {
    const parsedInput = validateCreateAdminUserInput(input);
    const createdUser = await this.adminUserRepository.createUser(parsedInput);
    return toAdminManagedUserView(createdUser);
  }
}

function validateCreateAdminUserInput(input: CreateAdminUserInput) {
  const errors: Array<{ field: string; message: string }> = [];
  const userName = typeof input.user_name === "string" ? input.user_name : null;
  const password = typeof input.password === "string" ? input.password : null;

  if (!userName || userName.trim().length === 0) {
    errors.push({
      field: "user_name",
      message: "user_name must be a string",
    });
  }

  if (!password || password.trim().length === 0) {
    errors.push({
      field: "password",
      message: "password must be a string",
    });
  } else if (password.trim().length < 8) {
    errors.push({
      field: "password",
      message: "password must contain at least 8 characters",
    });
  }

  if (input.is_admin !== undefined && typeof input.is_admin !== "boolean") {
    errors.push({
      field: "is_admin",
      message: "is_admin must be a boolean",
    });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    user_name: userName!.trim(),
    password: password!.trim(),
    is_admin: input.is_admin === true,
  };
}

export { AdminUserNameConflictError };
