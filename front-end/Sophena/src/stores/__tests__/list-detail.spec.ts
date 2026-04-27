import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from '../auth'
import { useListDetailStore } from '../list-detail'

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

describe('list detail store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('carrega os itens da lista autenticada em ordem de posição', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: {
            id: 'lista-1',
            name: 'Quero ler',
          },
          items: [
            {
              id: 'item-2',
              book_list_item_id: 'item-2',
              position: 2,
              book: {
                id: 'book-2',
                title: 'Segundo livro',
                author: 'Autora B',
                cover_url: null,
              },
            },
            {
              id: 'item-1',
              book_list_item_id: 'item-1',
              position: 1,
              book: {
                id: 'book-1',
                title: 'Primeiro livro',
                author: 'Autora A',
                cover_url: 'https://example.com/um.jpg',
              },
            },
          ],
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.fetchListDetail('lista-1')

    expect(store.list).toMatchObject({
      id: 'lista-1',
      name: 'Quero ler',
    })
    expect(store.items.map((item) => item.position)).toEqual([1, 2])
    expect(store.items.map((item) => item.book.title)).toEqual(['Primeiro livro', 'Segundo livro'])
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/lists/lista-1/items'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-valido',
        }),
      }),
    )
  })

  it('remove um livro da lista e mostra retorno amigável', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: {
            id: 'lista-1',
            name: 'Quero ler',
          },
          items: [
            {
              id: 'item-1',
              book_list_item_id: 'item-1',
              position: 1,
              book: {
                id: 'book-1',
                title: 'Livro removido',
                author: 'Autora',
                cover_url: null,
              },
            },
            {
              id: 'item-2',
              book_list_item_id: 'item-2',
              position: 2,
              book: {
                id: 'book-2',
                title: 'Livro que fica',
                author: 'Autor',
                cover_url: null,
              },
            },
          ],
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          message: 'Book removed from list',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.fetchListDetail('lista-1')
    await store.removeItem('lista-1', 'item-1')

    expect(store.items).toHaveLength(1)
    expect(store.items[0]?.book.title).toBe('Livro que fica')
    expect(store.feedbackMessage).toBe('Livro removido da lista.')
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/lists/lista-1/items/item-1'),
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-valido',
        }),
      }),
    )
  })

  it('mostra mensagem amigável ao falhar ao carregar a lista', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 404,
        body: {
          message: 'Resource not found',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.fetchListDetail('lista-invalida')

    expect(store.list).toBeNull()
    expect(store.items).toEqual([])
    expect(store.errorMessage).toBe('Não foi possível abrir essa lista agora.')
  })

  it('mostra mensagem amigável ao falhar ao remover um livro', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: {
            id: 'lista-1',
            name: 'Quero ler',
          },
          items: [
            {
              id: 'item-1',
              book_list_item_id: 'item-1',
              position: 1,
              book: {
                id: 'book-1',
                title: 'Livro bloqueado',
                author: 'Autora',
                cover_url: null,
              },
            },
          ],
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 500,
        body: {
          message: 'Internal server error',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.fetchListDetail('lista-1')

    await expect(store.removeItem('lista-1', 'item-1')).rejects.toThrow()

    expect(store.items).toHaveLength(1)
    expect(store.errorMessage).toBe('Não foi possível remover o livro agora.')
  })

  it('busca livros existentes para ajudar na escolha', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          items: [
            {
              id: 'book-1',
              title: 'Dom Casmurro',
              author: 'Machado de Assis',
              cover_url: null,
            },
            {
              id: 'book-2',
              title: 'Dom de Alencar',
              author: 'Autora',
              cover_url: null,
            },
          ],
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.searchBooks('Dom')

    expect(store.searchResults).toHaveLength(2)
    expect(store.searchResults[0]?.title).toBe('Dom Casmurro')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/books?search=Dom'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-valido',
        }),
      }),
    )
  })

  it('adiciona um livro existente e recarrega a lista', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: {
            id: 'lista-1',
            name: 'Quero ler',
          },
          items: [],
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 201,
        body: {
          id: 'item-1',
          list_id: 'lista-1',
          book_id: 'book-1',
          position: 1,
          created_at: '2026-01-01T12:00:00.000Z',
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: {
            id: 'lista-1',
            name: 'Quero ler',
          },
          items: [
            {
              id: 'item-1',
              book_list_item_id: 'item-1',
              position: 1,
              book: {
                id: 'book-1',
                title: 'Dom Casmurro',
                author: 'Machado de Assis',
                cover_url: null,
              },
            },
          ],
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.fetchListDetail('lista-1')
    await store.addExistingBook('lista-1', 'book-1')

    expect(store.items).toHaveLength(1)
    expect(store.items[0]?.book.title).toBe('Dom Casmurro')
    expect(store.feedbackMessage).toBe('Livro adicionado à lista.')
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/lists/lista-1/items'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          book_id: 'book-1',
        }),
      }),
    )
  })

  it('adiciona um livro manualmente e recarrega a lista', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: {
            id: 'lista-1',
            name: 'Quero ler',
          },
          items: [],
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 201,
        body: {
          id: 'item-1',
          list_id: 'lista-1',
          book_id: 'book-99',
          position: 1,
          created_at: '2026-01-01T12:00:00.000Z',
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: {
            id: 'lista-1',
            name: 'Quero ler',
          },
          items: [
            {
              id: 'item-1',
              book_list_item_id: 'item-1',
              position: 1,
              book: {
                id: 'book-99',
                title: 'Livro Manual',
                author: 'Autora Manual',
                cover_url: 'https://example.com/manual.jpg',
              },
            },
          ],
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.fetchListDetail('lista-1')
    await store.addManualBook('lista-1', {
      title: 'Livro Manual',
      author: 'Autora Manual',
      cover_url: 'https://example.com/manual.jpg',
    })

    expect(store.items).toHaveLength(1)
    expect(store.items[0]?.book.title).toBe('Livro Manual')
    expect(store.feedbackMessage).toBe('Livro adicionado à lista.')
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/lists/lista-1/items'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          book: {
            title: 'Livro Manual',
            author: 'Autora Manual',
            cover_url: 'https://example.com/manual.jpg',
          },
        }),
      }),
    )
  })

  it('mostra mensagem clara quando o livro já está na lista', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: {
            id: 'lista-1',
            name: 'Quero ler',
          },
          items: [],
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 409,
        body: {
          message: 'Book already exists in list',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.fetchListDetail('lista-1')

    await expect(store.addExistingBook('lista-1', 'book-1')).rejects.toThrow()

    expect(store.errorMessage).toBe('Esse livro já está nesta lista.')
  })

  it('reordena um livro na mesma lista e recarrega os itens', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: { id: 'lista-1', name: 'Quero ler' },
          items: [
            {
              id: 'item-1',
              book_list_item_id: 'item-1',
              position: 1,
              book: { id: 'book-1', title: 'Primeiro', author: 'Autora 1', cover_url: null },
            },
            {
              id: 'item-2',
              book_list_item_id: 'item-2',
              position: 2,
              book: { id: 'book-2', title: 'Segundo', author: 'Autora 2', cover_url: null },
            },
          ],
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          id: 'item-2',
          list_id: 'lista-1',
          book_id: 'book-2',
          position: 1,
          created_at: '2026-01-01T12:00:00.000Z',
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: { id: 'lista-1', name: 'Quero ler' },
          items: [
            {
              id: 'item-2',
              book_list_item_id: 'item-2',
              position: 1,
              book: { id: 'book-2', title: 'Segundo', author: 'Autora 2', cover_url: null },
            },
            {
              id: 'item-1',
              book_list_item_id: 'item-1',
              position: 2,
              book: { id: 'book-1', title: 'Primeiro', author: 'Autora 1', cover_url: null },
            },
          ],
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.fetchListDetail('lista-1')
    await store.reorderItem('lista-1', 'item-2', 1)

    expect(store.items.map((item) => item.book.title)).toEqual(['Segundo', 'Primeiro'])
    expect(store.feedbackMessage).toBe('Ordem atualizada com sucesso.')
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/lists/lista-1/items/item-2/reorder'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ position: 1 }),
      }),
    )
  })

  it('carrega as listas do usuário para mover um livro', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          items: [
            { id: 'lista-1', name: 'Quero ler', created_at: '2026-01-01T10:00:00.000Z', updated_at: '2026-01-01T10:00:00.000Z' },
            { id: 'lista-2', name: 'Lidos', created_at: '2026-01-01T11:00:00.000Z', updated_at: '2026-01-01T11:00:00.000Z' },
          ],
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.fetchAvailableLists()

    expect(store.availableLists).toHaveLength(2)
    expect(store.availableLists[1]?.name).toBe('Lidos')
  })

  it('move um livro para outra lista e recarrega a lista atual', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: { id: 'lista-1', name: 'Quero ler' },
          items: [
            {
              id: 'item-1',
              book_list_item_id: 'item-1',
              position: 1,
              book: { id: 'book-1', title: 'Dom Casmurro', author: 'Machado', cover_url: null },
            },
          ],
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          message: 'Book moved successfully',
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: { id: 'lista-1', name: 'Quero ler' },
          items: [],
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.fetchListDetail('lista-1')
    await store.moveItemToList('lista-1', 'item-1', 'lista-2', 1)

    expect(store.items).toEqual([])
    expect(store.feedbackMessage).toBe('Livro movido com sucesso.')
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/lists/lista-1/items/item-1/move'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          target_list_id: 'lista-2',
          target_position: 1,
        }),
      }),
    )
  })

  it('mostra mensagem clara quando a lista de destino já contém o livro', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          list: { id: 'lista-1', name: 'Quero ler' },
          items: [
            {
              id: 'item-1',
              book_list_item_id: 'item-1',
              position: 1,
              book: { id: 'book-1', title: 'Dom Casmurro', author: 'Machado', cover_url: null },
            },
          ],
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 409,
        body: {
          message: 'Book already exists in target list',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateUser()

    const store = useListDetailStore()
    await store.fetchListDetail('lista-1')

    await expect(store.moveItemToList('lista-1', 'item-1', 'lista-2', 1)).rejects.toThrow()

    expect(store.errorMessage).toBe('Esse livro já está na lista de destino.')
  })
})
