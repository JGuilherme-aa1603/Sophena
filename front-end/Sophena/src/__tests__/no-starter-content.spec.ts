import { describe, expect, it } from 'vitest'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

async function readVueFiles(directory: string): Promise<Array<{ path: string; content: string }>> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return readVueFiles(entryPath)
    }

    if (!entry.name.endsWith('.vue')) {
      return []
    }

    return [{
      path: entryPath,
      content: await readFile(entryPath, 'utf8'),
    }]
  }))

  return files.flat()
}

describe('conteúdo starter do Vue', () => {
  it('não mantém textos starter em inglês nas telas e componentes do app', async () => {
    const vueFiles = await readVueFiles(join(process.cwd(), 'src'))
    const forbiddenTexts = [
      'This is an about page',
      'Documentation',
      'Tooling',
      'Ecosystem',
      'Community',
      'Support Vue',
      'You did it',
    ]

    const violations = vueFiles.flatMap((file) => {
      return forbiddenTexts
        .filter((text) => file.content.includes(text))
        .map((text) => `${file.path}: ${text}`)
    })

    expect(violations).toEqual([])
  })
})
