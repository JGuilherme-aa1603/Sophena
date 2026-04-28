import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAdminBooksStore } from '../admin-books'
import { useAuthStore } from '../auth'

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

function authenticateAdmin() {
  const authStore = useAuthStore()
  authStore.setAccessToken('token-admin')
  authStore.user = {
    id: 'admin-1',
    user_name: 'admin',
    is_admin: true,
  }
}

describe('admin books store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('carrega livros com busca opcional', async () => {
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
    authenticateAdmin()

    const store = useAdminBooksStore()
    await store.fetchBooks('Dom')

    expect(store.books).toEqual([
      {
        id: 'book-1',
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        cover_url: null,
      },
    ])
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/books?search=Dom'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-admin',
        }),
      }),
    )
  })

  it('guarda a confirmação pendente quando a API exige confirmação para apagar', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({
      status: 409,
      body: {
        message: 'Book is still used in lists',
        requires_confirmation: true,
        removed_from_lists_count: 2,
      },
    }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateAdmin()

    const store = useAdminBooksStore()
    store.books = [
      {
        id: 'book-1',
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        cover_url: null,
      },
    ]

    await expect(store.requestDeleteBook('book-1')).rejects.toThrow('confirmation required')
    expect(store.pendingDeletion).toEqual({
      bookId: 'book-1',
      removedFromListsCount: 2,
    })
    expect(store.books).toHaveLength(1)
  })

  it('apaga o livro com força e remove da lista local', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({
      status: 200,
      body: {
        id: 'book-1',
        removed_from_lists_count: 2,
      },
    }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateAdmin()

    const store = useAdminBooksStore()
    store.books = [
      {
        id: 'book-1',
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        cover_url: null,
      },
      {
        id: 'book-2',
        title: 'Vidas Secas',
        author: 'Graciliano Ramos',
        cover_url: null,
      },
    ]
    store.pendingDeletion = {
      bookId: 'book-1',
      removedFromListsCount: 2,
    }

    await store.confirmDeleteBook('book-1')

    expect(store.books).toEqual([
      {
        id: 'book-2',
        title: 'Vidas Secas',
        author: 'Graciliano Ramos',
        cover_url: null,
      },
    ])
    expect(store.feedbackMessage).toBe('Livro apagado com sucesso.')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/books/book-1?force=true'),
      expect.objectContaining({
        method: 'DELETE',
      }),
    )
  })
})
