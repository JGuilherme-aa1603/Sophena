import { beforeEach, describe, expect, it, vi } from 'vitest'

import { uploadBookCoverRequest } from '../uploads'

describe('uploads api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('envia a capa para o endpoint relativo de upload', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ url: 'https://cdn.sophena.test/book-covers/capa.webp' }),
      text: async () => JSON.stringify({ url: 'https://cdn.sophena.test/book-covers/capa.webp' }),
    } as Response)

    vi.stubGlobal('fetch', fetchMock)

    await uploadBookCoverRequest(
      'token-valido',
      new File(['conteudo'], 'capa.png', { type: 'image/png' }),
    )

    expect(fetchMock).toHaveBeenCalledWith(
      '/uploads/book-covers',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-valido',
        }),
        body: expect.any(FormData),
      }),
    )
  })
})
