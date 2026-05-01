import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getApiBaseUrl, requestJson } from '../http'

describe('http api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('usa caminho relativo quando VITE_API_BASE_URL não está definido', () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined)

    expect(getApiBaseUrl()).toBe('')
  })

  it('ignora host local absoluto e usa caminho relativo durante desenvolvimento local', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000')

    expect(getApiBaseUrl()).toBe('')
  })

  it('usa caminho relativo quando VITE_API_BASE_URL está vazio', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
      text: async () => JSON.stringify({ success: true }),
    } as Response)

    vi.stubGlobal('fetch', fetchMock)

    vi.stubEnv('VITE_API_BASE_URL', '')

    await requestJson('/auth/refresh', {
      method: 'POST',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
  })

  it('mantém URL absoluta quando ela não aponta para o back-end local', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.sophena.com')

    expect(getApiBaseUrl({
      hostname: 'localhost',
      origin: 'http://localhost:5173',
    })).toBe('https://api.sophena.com')
  })

  it('usa caminho relativo em produção quando a API configurada está em outro domínio', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://sophena-api-final.onrender.com')

    expect(getApiBaseUrl({
      hostname: 'sophena.vercel.app',
      origin: 'https://sophena.vercel.app',
    })).toBe('')
  })

  it('usa caminho relativo em produção quando a API configurada já está na mesma origem', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://sophena.vercel.app')

    expect(getApiBaseUrl({
      hostname: 'sophena.vercel.app',
      origin: 'https://sophena.vercel.app',
    })).toBe('')
  })
})
