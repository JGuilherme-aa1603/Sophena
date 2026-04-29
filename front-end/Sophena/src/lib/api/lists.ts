import { requestJson } from './http'

export type UserList = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

type ReadListsResponse = {
  items: UserList[]
}

export async function fetchListsRequest(accessToken: string) {
  return requestJson<ReadListsResponse>('/lists', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function createListRequest(accessToken: string, input: { name: string }) {
  return requestJson<UserList>('/lists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}

export async function updateListRequest(accessToken: string, listId: string, input: { name: string }) {
  return requestJson<UserList>(`/lists/${listId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}

export async function deleteListRequest(accessToken: string, listId: string) {
  return requestJson<{ message: string }>(`/lists/${listId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}
