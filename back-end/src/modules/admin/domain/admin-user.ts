export type AdminManagedUser = {
  id: string;
  user_name: string;
  is_admin: boolean;
  created_at: string;
};

export function toAdminManagedUserView(user: AdminManagedUser) {
  return {
    id: user.id,
    user_name: user.user_name,
    is_admin: user.is_admin,
    created_at: user.created_at,
  };
}
