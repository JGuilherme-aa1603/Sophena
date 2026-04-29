import { describe, expect, it, vi } from 'vitest'

import {
  removeUserPictureRequest,
  updateUserPictureRequest,
} from '../auth'

function createJsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } satisfies Partial<Response> as Response
}

describe('auth api client', () => {
  it('envia a foto do usuário para o endpoint de perfil', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(createJsonResponse({
      id: 'user-1',
      user_name: 'leitora',
      user_picture_url: 'https://cdn.sophena.test/user-pictures/foto.webp',
      is_admin: false,
    }))
    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['foto'], 'foto.png', { type: 'image/png' })
    const response = await updateUserPictureRequest('token-valido', file)

    expect(response.user_picture_url).toBe('https://cdn.sophena.test/user-pictures/foto.webp')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me/picture'),
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-valido',
        }),
        body: expect.any(FormData),
      }),
    )
  })

  it('remove a foto do usuário pelo endpoint de perfil', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(createJsonResponse({
      id: 'user-1',
      user_name: 'leitora',
      user_picture_url: null,
      is_admin: false,
    }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await removeUserPictureRequest('token-valido')

    expect(response.user_picture_url).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me/picture'),
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-valido',
        }),
      }),
    )
  })
})
