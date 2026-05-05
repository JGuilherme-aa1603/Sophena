import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const baseCssPath = join(process.cwd(), 'src/assets/base.css')
const baseCss = readFileSync(baseCssPath, 'utf8')

function cssBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`, 'g')
  const bodies: string[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(baseCss)) !== null) {
    if (match.groups?.body) bodies.push(match.groups.body)
  }
  return bodies.join('\n')
}

describe('theme tokens', () => {
  it('deixa o brilho claro verde mais visível sem depender dos tokens de capa', () => {
    const rootTokens = cssBlock(':root')

    expect(rootTokens).toContain('--color-page-accent-gradient-soft: rgba(171, 215, 186, 0.98);')
    expect(rootTokens).toContain('--color-page-accent-gradient-strong: rgba(120, 182, 141, 0.99);')
  })

  it('deixa o brilho claro roxo mais visível quando o tema moderno está ativo', () => {
    const purpleTokens = cssBlock(":root[data-theme='purple']")

    expect(purpleTokens).toContain('--color-page-accent-gradient-soft: rgba(221, 214, 254, 0.98);')
    expect(purpleTokens).toContain('--color-page-accent-gradient-strong: rgba(221, 214, 254, 0.99);')
  })

  it('usa brilho colorido próprio no modo escuro sem reaproveitar o gradiente claro', () => {
    const darkTokens = cssBlock(":root[data-appearance='dark']")

    expect(darkTokens).toContain('--color-page-accent-gradient-soft: rgba(53, 95, 74, 0.32);')
    expect(darkTokens).toContain('--color-page-accent-gradient-strong: rgba(53, 95, 74, 0.38);')
    expect(darkTokens).not.toContain('rgba(230, 239, 233, 0.92)')
    expect(darkTokens).not.toContain('rgba(237, 233, 254, 0.92)')
  })

  it('ajusta o brilho escuro para roxo quando o tema moderno está ativo', () => {
    const darkPurpleTokens = cssBlock(":root[data-theme='purple'][data-appearance='dark']")

    expect(darkPurpleTokens).toContain('--color-page-accent-gradient-soft: rgba(109, 40, 217, 0.32);')
    expect(darkPurpleTokens).toContain('--color-page-accent-gradient-strong: rgba(109, 40, 217, 0.38);')
  })
})
