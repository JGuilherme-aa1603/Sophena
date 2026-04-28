import { requestJson } from './http'

export type BookSearchResult = {
  id: string
  title: string
  author: string
  cover_url: string | null
}

type SearchBooksResponse = {
  items: BookSearchResult[]
}

type DeleteBookResponse = {
  id: string
  removed_from_lists_count: number
}

export async function fetchBooksRequest(accessToken: string, search?: string) {
  const query = new URLSearchParams()

  if (search && search.trim().length > 0) {
    query.set('search', search.trim())
  }

  const path = query.size > 0 ? `/books?${query.toString()}` : '/books'

  return requestJson<SearchBooksResponse>(path, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function searchBooksRequest(accessToken: string, search: string) {
  return fetchBooksRequest(accessToken, search)
}

export async function deleteBookRequest(accessToken: string, bookId: string, force = false) {
  const query = force ? '?force=true' : ''

  return requestJson<DeleteBookResponse>(`/books/${bookId}${query}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}
