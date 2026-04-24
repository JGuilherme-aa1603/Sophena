export type AuthUser = {
  id: string;
  user_name: string;
  password_hash: string;
  is_admin: boolean;
};

export type AuthenticatedUserView = {
  id: string;
  user_name: string;
  is_admin: boolean;
};

export function toAuthenticatedUserView(user: AuthUser): AuthenticatedUserView {
  return {
    id: user.id,
    user_name: user.user_name,
    is_admin: user.is_admin,
  };
}
