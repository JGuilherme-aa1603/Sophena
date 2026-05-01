import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

describe('configuracao de rotas da Vercel', () => {
  test('redireciona rotas do app para o index.html ao recarregar a pagina', async () => {
    const configPath = join(process.cwd(), 'vercel.json')
    const config = JSON.parse(await readFile(configPath, 'utf8')) as {
      rewrites?: Array<{
        source: string
        destination: string
      }>
    }

    expect(config.rewrites).toContainEqual({
      source: '/(.*)',
      destination: '/index.html',
    })
  })

  test('encaminha chamadas da API pelos caminhos originais antes do fallback do app', async () => {
    const configPath = join(process.cwd(), 'vercel.json')
    const config = JSON.parse(await readFile(configPath, 'utf8')) as {
      rewrites?: Array<{
        source: string
        destination: string
      }>
    }

    const apiBaseUrl = 'https://sophena-api-final.onrender.com'
    const apiRewrites = [
      { source: '/auth', destination: `${apiBaseUrl}/auth` },
      { source: '/auth/(.*)', destination: `${apiBaseUrl}/auth/$1` },
      { source: '/admin', destination: `${apiBaseUrl}/admin` },
      { source: '/admin/(.*)', destination: `${apiBaseUrl}/admin/$1` },
      { source: '/books', destination: `${apiBaseUrl}/books` },
      { source: '/books/(.*)', destination: `${apiBaseUrl}/books/$1` },
      { source: '/lists', destination: `${apiBaseUrl}/lists` },
      { source: '/lists/(.*)', destination: `${apiBaseUrl}/lists/$1` },
      { source: '/uploads', destination: `${apiBaseUrl}/uploads` },
      { source: '/uploads/(.*)', destination: `${apiBaseUrl}/uploads/$1` },
    ]

    expect(config.rewrites?.slice(0, apiRewrites.length)).toEqual(apiRewrites)
    expect(config.rewrites?.[apiRewrites.length]).toEqual({
      source: '/(.*)',
      destination: '/index.html',
    })
  })
})
