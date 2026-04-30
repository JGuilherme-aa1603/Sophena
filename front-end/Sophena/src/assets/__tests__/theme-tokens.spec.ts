import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const baseCssPath = join(process.cwd(), 'src/assets/base.css')
const baseCss = readFileSync(baseCssPath, 'utf8')

function cssBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = baseCss.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`))

  return match?.groups?.body ?? ''
}

describe('theme tokens', () => {
  it('mantém o brilho claro do tema apontando para as cores de destaque', () => {
    const rootTokens = cssBlock(':root')

    expect(rootTokens).toContain('--color-page-accent-gradient-soft: var(--color-primary-gradient-soft);')
    expect(rootTokens).toContain('--color-page-accent-gradient-strong: var(--color-primary-gradient-strong);')
  })

  it('usa brilho colorido próprio no modo escuro sem reaproveitar o gradiente claro', () => {
    const darkTokens = cssBlock(":root[data-appearance='dark']")

    expect(darkTokens).toContain('--color-page-accent-gradient-soft: rgba(53, 95, 74, 0.3);')
    expect(darkTokens).toContain('--color-page-accent-gradient-strong: rgba(53, 95, 74, 0.36);')
    expect(darkTokens).not.toContain('rgba(230, 239, 233, 0.92)')
    expect(darkTokens).not.toContain('rgba(237, 233, 254, 0.92)')
  })

  it('ajusta o brilho escuro para roxo quando o tema moderno está ativo', () => {
    const darkPurpleTokens = cssBlock(":root[data-theme='purple'][data-appearance='dark']")

    expect(darkPurpleTokens).toContain('--color-page-accent-gradient-soft: rgba(109, 40, 217, 0.3);')
    expect(darkPurpleTokens).toContain('--color-page-accent-gradient-strong: rgba(109, 40, 217, 0.36);')
  })
})
