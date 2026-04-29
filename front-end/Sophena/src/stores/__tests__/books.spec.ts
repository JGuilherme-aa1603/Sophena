import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from '../auth'
import { useBooksStore } from '../books'

type MockJsonResponse = {
  status: number
  body: unknown
}

function createJsonResponse(input: MockJsonResponse) {
  return {
    ok: input.status >= 200 && input.status < 300,
    status: input.status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => input.body,
    text: async () => JSON.stringify(input.body),
  } satisfies Partial<Response> as Response
}

function authenticateUser() {
  const authStore = useAuthStore()
  authStore.setAccessToken('token-valido')
  authStore.user = {
    id: 'user-1',
    user_name: 'leitora',
    is_admin: false,
  }
}

describe('books store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('carrega livros com pesquisa e filtros', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({
      status: 200,
      body: {
        items: [
          {
            id: 'book-1',
            title: 'Dom Casmurro',
            author: 'Machado de Assis',
            cover_url: null,
          },
        ],
      },
    }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useBooksStore()
    await store.fetchBooks({
      search: 'Dom',
      author: 'Machado',
      cover: 'without',
    })

    expect(store.books).toEqual([
      {
        id: 'book-1',
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        cover_url: null,
      },
    ])
    expect(store.errorMessage).toBe('')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/books?search=Dom&author=Machado&cover=without'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-valido',
        }),
      }),
    )
  })

  it('limpa os filtros e recarrega todos os livros', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: { items: [] },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          items: [
            {
              id: 'book-2',
              title: 'Vidas Secas',
              author: 'Graciliano Ramos',
              cover_url: 'https://example.com/vidas.jpg',
            },
          ],
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useBooksStore()
    await store.fetchBooks({
      search: 'Dom',
      author: 'Machado',
      cover: 'with',
    })
    await store.clearFilters()

    expect(store.filters).toEqual({
      search: '',
      author: '',
      cover: 'all',
    })
    expect(store.books[0]?.title).toBe('Vidas Secas')
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/books'),
      expect.objectContaining({
        method: 'GET',
      }),
    )
  })

  it('mostra mensagem em português quando a sessão expirou', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({
      status: 401,
      body: {
        message: 'Authentication required',
      },
    }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useBooksStore()
    await store.fetchBooks()

    expect(store.books).toEqual([])
    expect(store.errorMessage).toBe('Sua sessão expirou. Entre novamente.')
  })

  it('mostra mensagem em português quando não consegue carregar os livros', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({
      status: 500,
      body: {
        message: 'Internal server error',
      },
    }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useBooksStore()
    await store.fetchBooks()

    expect(store.books).toEqual([])
    expect(store.errorMessage).toBe('Não foi possível carregar os livros agora.')
  })
})
