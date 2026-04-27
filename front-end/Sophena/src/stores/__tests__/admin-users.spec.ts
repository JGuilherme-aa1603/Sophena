import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from '../auth'
import { useAdminUsersStore } from '../admin-users'

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

describe('admin users store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('cria um usuário normal com feedback amigável', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 201,
        body: {
          id: 'user-10',
          user_name: 'nova-leitora',
          is_admin: false,
          created_at: '2026-01-01T12:00:00.000Z',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateAdmin()

    const store = useAdminUsersStore()
    const createdUser = await store.createUser({
      user_name: 'nova-leitora',
      password: 'SenhaNova#123',
      is_admin: false,
    })

    expect(createdUser).toMatchObject({
      id: 'user-10',
      user_name: 'nova-leitora',
      is_admin: false,
    })
    expect(store.feedbackMessage).toBe('Usuário criado com sucesso.')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-admin',
        }),
      }),
    )
  })

  it('cria um usuário administrador quando solicitado', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 201,
        body: {
          id: 'user-11',
          user_name: 'nova-admin',
          is_admin: true,
          created_at: '2026-01-01T13:00:00.000Z',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateAdmin()

    const store = useAdminUsersStore()
    const createdUser = await store.createUser({
      user_name: 'nova-admin',
      password: 'SenhaNova#456',
      is_admin: true,
    })

    expect(createdUser.is_admin).toBe(true)
    expect(store.feedbackMessage).toBe('Usuário criado com sucesso.')
  })

  it('valida user_name e password antes de enviar', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    authenticateAdmin()

    const store = useAdminUsersStore()

    await expect(
      store.createUser({
        user_name: '   ',
        password: '123',
        is_admin: false,
      }),
    ).rejects.toThrow()

    expect(store.errorMessage).toBe('Preencha usuário e senha com pelo menos 8 caracteres.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('mostra mensagem clara quando o usuário já existe', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 409,
        body: {
          message: 'User name already exists',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateAdmin()

    const store = useAdminUsersStore()

    await expect(
      store.createUser({
        user_name: 'usuario-existente',
        password: 'SenhaNova#123',
        is_admin: false,
      }),
    ).rejects.toThrow()

    expect(store.errorMessage).toBe('Já existe um usuário com esse nome.')
  })

  it('mostra mensagem clara quando o usuário não tem permissão', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 403,
        body: {
          message: 'Forbidden',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)
    authenticateAdmin()

    const store = useAdminUsersStore()

    await expect(
      store.createUser({
        user_name: 'sem-permissao',
        password: 'SenhaNova#123',
        is_admin: false,
      }),
    ).rejects.toThrow()

    expect(store.errorMessage).toBe('Você não tem permissão para criar usuários.')
  })
})
