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

export async function searchBooksRequest(accessToken: string, search: string) {
  const query = new URLSearchParams({
    search,
  })

  return requestJson<SearchBooksResponse>(`/books?${query.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}
