import {
  ForbiddenError,
  ResourceNotFoundError,
  UnauthorizedError,
} from "./auth-errors.ts";
import { type AuthUserRepository, type TokenService } from "./auth-service.ts";
import { type AuthenticatedUserView, toAuthenticatedUserView } from "../domain/auth-user.ts";

export class AuthContextService {
  constructor(
    private readonly authUserRepository: AuthUserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async authenticate(authorizationHeader?: string): Promise<AuthenticatedUserView> {
    const token = extractBearerToken(authorizationHeader);

    if (!token) {
      throw new UnauthorizedError();
    }

    const payload = this.tokenService.verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedError();
    }

    const user = await this.authUserRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError();
    }

    return toAuthenticatedUserView(user);
  }

  ensureAdmin(user: AuthenticatedUserView) {
    if (!user.is_admin) {
      throw new ForbiddenError();
    }
  }

  ensureOwnership(user: AuthenticatedUserView, resourceUserId?: string) {
    if (!resourceUserId) {
      throw new ResourceNotFoundError();
    }

    if (user.is_admin) {
      return;
    }

    if (user.id !== resourceUserId) {
      throw new ResourceNotFoundError();
    }
  }
}

function extractBearerToken(authorizationHeader?: string) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}
