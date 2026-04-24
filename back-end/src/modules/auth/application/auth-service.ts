import { InvalidCredentialsError, UnauthorizedError, ValidationError } from "./auth-errors.ts";
import { verifyPassword } from "../infrastructure/security/password-hasher.ts";
import { type AuthUser, toAuthenticatedUserView } from "../domain/auth-user.ts";
import { AuthContextService } from "./auth-context-service.ts";

export type AuthUserRepository = {
  findByUserName(userName: string): Promise<AuthUser | null>;
  findById(userId: string): Promise<AuthUser | null>;
};

export type AccessTokenPayload = {
  sub: string;
  user_name: string;
  is_admin: boolean;
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
  type: "refresh";
  exp: number;
};

export type TokenService = {
  createAccessToken(user: AuthUser): string;
  createRefreshToken(user: AuthUser): string;
  verifyAccessToken(token: string): AccessTokenPayload | null;
  verifyRefreshToken(token: string): RefreshTokenPayload | null;
};

export type RefreshTokenStore = {
  register(token: string, payload: RefreshTokenPayload): Promise<void>;
  rotate(currentToken: string, nextToken: string, nextPayload: RefreshTokenPayload): Promise<boolean>;
  invalidate(token: string): Promise<boolean>;
  isActive(token: string): Promise<boolean>;
};

type LoginInput = {
  user_name?: unknown;
  password?: unknown;
};

export class AuthService {
  constructor(
    private readonly authUserRepository: AuthUserRepository,
    private readonly tokenService: TokenService,
    private readonly refreshTokenStore: RefreshTokenStore,
  ) {}

  async login(input: LoginInput) {
    const parsedInput = validateLoginInput(input);
    const user = await this.authUserRepository.findByUserName(parsedInput.user_name);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = verifyPassword(parsedInput.password, user.password_hash);

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const refresh_token = this.tokenService.createRefreshToken(user);
    const refreshPayload = this.tokenService.verifyRefreshToken(refresh_token);

    if (!refreshPayload) {
      throw new UnauthorizedError();
    }

    await this.refreshTokenStore.register(refresh_token, refreshPayload);

    return {
      access_token: this.tokenService.createAccessToken(user),
      refresh_token,
      user: toAuthenticatedUserView(user),
    };
  }

  async me(authorizationHeader?: string) {
    const authContextService = new AuthContextService(
      this.authUserRepository,
      this.tokenService,
    );

    return authContextService.authenticate(authorizationHeader);
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedError();
    }

    const refreshPayload = this.tokenService.verifyRefreshToken(refreshToken);

    if (!refreshPayload) {
      throw new UnauthorizedError();
    }

    const isActive = await this.refreshTokenStore.isActive(refreshToken);

    if (!isActive) {
      throw new UnauthorizedError();
    }

    const user = await this.authUserRepository.findById(refreshPayload.sub);

    if (!user) {
      throw new UnauthorizedError();
    }

    const nextRefreshToken = this.tokenService.createRefreshToken(user);
    const nextRefreshPayload = this.tokenService.verifyRefreshToken(nextRefreshToken);

    if (!nextRefreshPayload) {
      throw new UnauthorizedError();
    }

    const rotated = await this.refreshTokenStore.rotate(
      refreshToken,
      nextRefreshToken,
      nextRefreshPayload,
    );

    if (!rotated) {
      throw new UnauthorizedError();
    }

    return {
      access_token: this.tokenService.createAccessToken(user),
      refresh_token: nextRefreshToken,
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedError();
    }

    const invalidated = await this.refreshTokenStore.invalidate(refreshToken);

    if (!invalidated) {
      throw new UnauthorizedError();
    }

    return {
      message: "Logout successful",
    };
  }

  readRefreshTokenUserId(refreshToken?: string) {
    if (!refreshToken) {
      return undefined;
    }

    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    return payload?.sub;
  }
}

function validateLoginInput(input: LoginInput) {
  const errors: Array<{ field: string; message: string }> = [];
  const userName = typeof input.user_name === "string" ? input.user_name : null;
  const password = typeof input.password === "string" ? input.password : null;

  if (!userName || userName.trim().length === 0) {
    errors.push({ field: "user_name", message: "user_name must be a string" });
  }

  if (!password || password.trim().length === 0) {
    errors.push({ field: "password", message: "password must be a string" });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return {
    user_name: userName!.trim(),
    password: password!.trim(),
  };
}
