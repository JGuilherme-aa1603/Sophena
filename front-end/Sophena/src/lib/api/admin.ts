import { requestJson } from './http'

export type AdminCreatedUser = {
  id: string
  user_name: string
  is_admin: boolean
  created_at: string
}

export async function createAdminUserRequest(
  accessToken: string,
  input: {
    user_name: string
    password: string
    is_admin: boolean
  },
) {
  return requestJson<AdminCreatedUser>('/admin/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}
