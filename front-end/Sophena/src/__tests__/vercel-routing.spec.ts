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

  test('encaminha chamadas da API pelo mesmo domínio antes do fallback do app', async () => {
    const configPath = join(process.cwd(), 'vercel.json')
    const config = JSON.parse(await readFile(configPath, 'utf8')) as {
      rewrites?: Array<{
        source: string
        destination: string
      }>
    }

    expect(config.rewrites?.[0]).toEqual({
      source: '/api/(.*)',
      destination: 'https://sophena-api-final.onrender.com/$1',
    })
  })
})
