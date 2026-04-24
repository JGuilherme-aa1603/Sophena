import { requestJson } from './http'

export type AuthenticatedUser = {
  id: string
  user_name: string
  is_admin: boolean
}

export type LoginResponse = {
  access_token: string
  user: AuthenticatedUser
}

export async function loginRequest(input: {
  user_name: string
  password: string
}) {
  return requestJson<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}

export async function meRequest(accessToken: string) {
  return requestJson<AuthenticatedUser>('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}
