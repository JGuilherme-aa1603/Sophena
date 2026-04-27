import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAdminLogsStore } from '../admin-logs'
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

describe('admin logs store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('carrega resumo e logs paginados com filtros', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          success_count: 12,
          warn_count: 3,
          error_count: 1,
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          items: [
            {
              id: 'log-1',
              level: 'ERROR',
              status_code: 500,
              message: 'Falha inesperada',
              route: '/admin/logs',
              method: 'GET',
              user_id: 'admin-1',
              created_at: '2026-04-20T12:00:00.000Z',
            },
          ],
          pagination: {
            page: 2,
            limit: 10,
            total: 11,
          },
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateAdmin()

    const store = useAdminLogsStore()
    store.filters.level = 'ERROR'
    store.filters.method = 'GET'
    store.filters.status_code = '500'
    store.filters.from = '2026-04-20T00:00:00.000Z'
    store.filters.to = '2026-04-22T00:00:00.000Z'
    store.pagination.page = 2
    store.pagination.limit = 10

    await store.fetchSummary()
    await store.fetchLogs()

    expect(store.summary).toEqual({
      success_count: 12,
      warn_count: 3,
      error_count: 1,
    })
    expect(store.logs).toHaveLength(1)
    expect(store.pagination.total).toBe(11)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/admin/logs?'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-admin',
        }),
      }),
    )
  })

  it('mostra mensagem amigável quando falha ao carregar logs', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 500,
        body: {
          message: 'Internal server error',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateAdmin()

    const store = useAdminLogsStore()
    await store.fetchLogs()

    expect(store.logs).toEqual([])
    expect(store.errorMessage).toBe('Não foi possível carregar os registros agora.')
  })

  it('mostra mensagem amigável para filtros inválidos', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 400,
        body: {
          errors: [
            {
              field: 'from',
              message: 'from must be ISO date',
            },
          ],
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateAdmin()

    const store = useAdminLogsStore()
    store.filters.from = 'data-invalida'

    await store.fetchLogs()

    expect(store.errorMessage).toBe('Confira os filtros e tente novamente.')
  })

  it('avança para a próxima página', async () => {
    authenticateAdmin()
    const store = useAdminLogsStore()
    store.pagination.page = 1
    store.pagination.limit = 10
    store.pagination.total = 21

    store.goToNextPage()

    expect(store.pagination.page).toBe(2)
  })
})
