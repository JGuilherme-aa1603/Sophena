export type AuthUser = {
  id: string;
  user_name: string;
  password_hash: string;
  user_picture_url: string | null;
  is_admin: boolean;
};

export type AuthenticatedUserView = {
  id: string;
  user_name: string;
  user_picture_url: string | null;
  is_admin: boolean;
};

export function toAuthenticatedUserView(user: AuthUser): AuthenticatedUserView {
  return {
    id: user.id,
    user_name: user.user_name,
    user_picture_url: user.user_picture_url,
    is_admin: user.is_admin,
  };
}
