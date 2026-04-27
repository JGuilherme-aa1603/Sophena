import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

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

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('faz login, guarda o token só em memória e carrega o usuário autenticado', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          access_token: 'token-em-memoria',
          user: {
            id: 'user-1',
            user_name: 'leitora',
            is_admin: false,
          },
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    await authStore.login({
      user_name: 'leitora',
      password: 'SenhaSegura#123',
    })

    expect(authStore.accessToken).toBe('token-em-memoria')
    expect(authStore.user).toEqual({
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    })
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(sessionStorage.getItem('access_token')).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
  })

  it('carrega o usuário com GET /auth/me quando já existe token em memória', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          id: 'user-2',
          user_name: 'admin',
          is_admin: true,
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.setAccessToken('token-de-acesso')

    await authStore.fetchCurrentUser()

    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user).toEqual({
      id: 'user-2',
      user_name: 'admin',
      is_admin: true,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-de-acesso',
        }),
      }),
    )
  })

  it('limpa a sessão quando GET /auth/me responde 401', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 401,
        body: {
          message: 'Authentication required',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.setAccessToken('token-expirado')
    authStore.user = {
      id: 'user-3',
      user_name: 'leitora-expirada',
      is_admin: false,
    }

    await authStore.fetchCurrentUser()

    expect(authStore.accessToken).toBeNull()
    expect(authStore.user).toBeNull()
    expect(authStore.errorMessage).toBe('Sua sessão expirou. Entre novamente.')
  })

  it('mostra mensagem amigável quando o login falha', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 401,
        body: {
          message: 'Invalid credentials',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()

    await expect(
      authStore.login({
        user_name: 'leitora',
        password: 'SenhaErrada#123',
      }),
    ).rejects.toThrow()

    expect(authStore.accessToken).toBeNull()
    expect(authStore.user).toBeNull()
    expect(authStore.errorMessage).toBe('Usuário ou senha não conferem.')
  })

  it('restaura a sessão com o cookie de refresh ao recarregar o site', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          access_token: 'token-renovado',
        },
      }))
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {
          id: 'user-9',
          user_name: 'leitora-persistida',
          is_admin: false,
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    const hasSession = await authStore.ensureSession()

    expect(hasSession).toBe(true)
    expect(authStore.accessToken).toBe('token-renovado')
    expect(authStore.user).toEqual({
      id: 'user-9',
      user_name: 'leitora-persistida',
      is_admin: false,
    })
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(sessionStorage.getItem('access_token')).toBeNull()
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/auth/refresh'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-renovado',
        }),
      }),
    )
  })

  it('mantém o usuário deslogado quando o refresh falha', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 401,
        body: {
          message: 'Authentication required',
        },
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    const hasSession = await authStore.ensureSession()

    expect(hasSession).toBe(false)
    expect(authStore.accessToken).toBeNull()
    expect(authStore.user).toBeNull()
    expect(authStore.errorMessage).toBe('')
  })

  it('faz logout pela API antes de limpar a sessão em memória', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createJsonResponse({
        status: 200,
        body: {},
      }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-10',
      user_name: 'leitora-ativa',
      is_admin: false,
    }

    await authStore.logout()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-valido',
        }),
      }),
    )
    expect(authStore.accessToken).toBeNull()
    expect(authStore.user).toBeNull()
    expect(authStore.errorMessage).toBe('')
  })

  it('mantém a sessão e mostra mensagem amigável quando o logout falha', async () => {
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
      id: 'user-11',
      user_name: 'leitora-com-erro',
      is_admin: false,
    }

    await expect(authStore.logout()).rejects.toThrow()

    expect(authStore.accessToken).toBe('token-valido')
    expect(authStore.user).toEqual({
      id: 'user-11',
      user_name: 'leitora-com-erro',
      is_admin: false,
    })
    expect(authStore.errorMessage).toBe('Não foi possível sair agora. Tente novamente em instantes.')
  })
})
