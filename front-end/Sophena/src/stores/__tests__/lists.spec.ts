import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from '../auth'
import { useListsStore } from '../lists'

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

describe('lists store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('carrega as listas do usuário autenticado', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          items: [
            {
              id: 'lista-1',
              name: 'Quero ler',
              created_at: '2026-01-01T10:00:00.000Z',
              updated_at: '2026-01-01T10:00:00.000Z',
            },
          ],
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }

    const listsStore = useListsStore()
    await listsStore.fetchLists()

    expect(listsStore.items).toHaveLength(1)
    expect(listsStore.items[0]).toMatchObject({
      id: 'lista-1',
      name: 'Quero ler',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/lists'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-valido',
        }),
      }),
    )
  })

  it('cria uma nova lista e adiciona no estado', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 201,
        body: {
          id: 'lista-2',
          name: 'Lendo agora',
          created_at: '2026-01-01T11:00:00.000Z',
          updated_at: '2026-01-01T11:00:00.000Z',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }

    const listsStore = useListsStore()
    await listsStore.createList('Lendo agora')

    expect(listsStore.items).toHaveLength(1)
    expect(listsStore.items[0]).toBeDefined()
    expect(listsStore.items[0]?.name).toBe('Lendo agora')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/lists'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          name: 'Lendo agora',
        }),
      }),
    )
  })

  it('mostra mensagem amigável ao falhar ao carregar listas', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 500,
        body: {
          message: 'Internal server error',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }

    const listsStore = useListsStore()
    await listsStore.fetchLists()

    expect(listsStore.items).toEqual([])
    expect(listsStore.errorMessage).toBe('Não foi possível carregar suas listas agora.')
  })

  it('mostra mensagem amigável ao falhar ao criar lista', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 409,
        body: {
          message: 'List name already exists',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }

    const listsStore = useListsStore()

    await expect(listsStore.createList('Quero ler')).rejects.toThrow()

    expect(listsStore.errorMessage).toBe('Você já tem uma lista com esse nome.')
  })

  it('renomeia uma lista existente e atualiza o estado', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          id: 'lista-1',
          name: 'Lidos este ano',
          created_at: '2026-01-01T10:00:00.000Z',
          updated_at: '2026-01-02T10:00:00.000Z',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }

    const listsStore = useListsStore()
    listsStore.items = [
      {
        id: 'lista-1',
        name: 'Lidos',
        icon: 'bookmark',
        tint_index: 0,
        preview_items: [],
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-01T10:00:00.000Z',
      },
    ]

    await listsStore.updateListName('lista-1', 'Lidos este ano')

    expect(listsStore.items[0]?.name).toBe('Lidos este ano')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/lists/lista-1'),
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify({
          name: 'Lidos este ano',
        }),
      }),
    )
  })

  it('remove uma lista apagada do estado', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          message: 'List deleted successfully',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }

    const listsStore = useListsStore()
    listsStore.items = [
      {
        id: 'lista-1',
        name: 'Quero ler',
        icon: 'bookmark',
        tint_index: 0,
        preview_items: [],
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 'lista-2',
        name: 'Lidos',
        icon: 'bookmark',
        tint_index: 0,
        preview_items: [],
        created_at: '2026-01-01T11:00:00.000Z',
        updated_at: '2026-01-01T11:00:00.000Z',
      },
    ]

    await listsStore.deleteList('lista-1')

    expect(listsStore.items.map((list) => list.id)).toEqual(['lista-2'])
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/lists/lista-1'),
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    )
  })

  it('mostra mensagem amigável quando o novo nome já existe', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 409,
        body: {
          message: 'List name already exists',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }

    const listsStore = useListsStore()

    await expect(listsStore.updateListName('lista-1', 'Quero ler')).rejects.toThrow()

    expect(listsStore.errorMessage).toBe('Você já tem uma lista com esse nome.')
  })

  it('mostra mensagem amigável ao falhar ao apagar lista', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 500,
        body: {
          message: 'Internal server error',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }

    const listsStore = useListsStore()

    await expect(listsStore.deleteList('lista-1')).rejects.toThrow()

    expect(listsStore.errorMessage).toBe('Não foi possível apagar a lista agora.')
  })
})
