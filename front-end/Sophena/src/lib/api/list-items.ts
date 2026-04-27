import { requestJson } from './http'

export type ListDetail = {
  id: string
  name: string
}

export type ListItemBook = {
  id: string
  title: string
  author: string
  cover_url: string | null
}

export type ListItem = {
  id: string
  book_list_item_id: string
  position: number
  book: ListItemBook
}

export type ListDetailResponse = {
  list: ListDetail
  items: ListItem[]
}

export type RemoveListItemResponse = {
  message: string
}

export type CreateListItemResponse = {
  id: string
  list_id: string
  book_id: string
  position: number
  created_at: string
}

export type ReorderListItemResponse = {
  id: string
  list_id: string
  book_id: string
  position: number
  updated_at: string
}

export type MoveListItemResponse = {
  message: string
}

export async function fetchListItemsRequest(accessToken: string, listId: string) {
  return requestJson<ListDetailResponse>(`/lists/${listId}/items`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function deleteListItemRequest(accessToken: string, listId: string, itemId: string) {
  return requestJson<RemoveListItemResponse>(`/lists/${listId}/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function addExistingBookToListRequest(accessToken: string, listId: string, bookId: string) {
  return requestJson<CreateListItemResponse>(`/lists/${listId}/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      book_id: bookId,
    }),
  })
}

export async function addManualBookToListRequest(
  accessToken: string,
  listId: string,
  input: {
    title: string
    author: string
    cover_url?: string
  },
) {
  return requestJson<CreateListItemResponse>(`/lists/${listId}/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      book: {
        title: input.title,
        author: input.author,
        cover_url: input.cover_url ?? undefined,
      },
    }),
  })
}

export async function reorderListItemRequest(
  accessToken: string,
  listId: string,
  itemId: string,
  position: number,
) {
  return requestJson<ReorderListItemResponse>(`/lists/${listId}/items/${itemId}/reorder`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      position,
    }),
  })
}

export async function moveListItemRequest(
  accessToken: string,
  listId: string,
  itemId: string,
  input: {
    target_list_id: string
    target_position: number
  },
) {
  return requestJson<MoveListItemResponse>(`/lists/${listId}/items/${itemId}/move`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
}
