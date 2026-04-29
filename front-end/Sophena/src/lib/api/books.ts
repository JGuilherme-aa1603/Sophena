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

export type BookCoverFilter = 'all' | 'with' | 'without'

export type FetchBooksFilters = {
  search?: string
  author?: string
  cover?: BookCoverFilter
}

type DeleteBookResponse = {
  id: string
  removed_from_lists_count: number
}

export async function fetchBooksRequest(accessToken: string, filters: string | FetchBooksFilters = {}) {
  const query = new URLSearchParams()
  const normalizedFilters = typeof filters === 'string' ? { search: filters } : filters

  if (normalizedFilters.search && normalizedFilters.search.trim().length > 0) {
    query.set('search', normalizedFilters.search.trim())
  }

  if (normalizedFilters.author && normalizedFilters.author.trim().length > 0) {
    query.set('author', normalizedFilters.author.trim())
  }

  if (normalizedFilters.cover === 'with' || normalizedFilters.cover === 'without') {
    query.set('cover', normalizedFilters.cover)
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
  return fetchBooksRequest(accessToken, { search })
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
