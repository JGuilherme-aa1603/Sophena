import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchBooksRequest } from '../books'

function createJsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } satisfies Partial<Response> as Response
}

describe('books api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('envia somente os filtros preenchidos ao buscar livros', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({ items: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await fetchBooksRequest('token-valido', {
      search: ' Dom ',
      author: ' Machado ',
      cover: 'with',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/books?search=Dom&author=Machado&cover=with',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-valido',
        }),
      }),
    )
  })

  it('não envia filtros vazios na busca de livros', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({ items: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await fetchBooksRequest('token-valido', {
      search: '  ',
      author: '',
      cover: 'all',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/books',
      expect.objectContaining({
        method: 'GET',
      }),
    )
  })
})
