import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import ResponsiveSheetModal from '../overlay/ResponsiveSheetModal.vue'

const sheetSourcePath = join(process.cwd(), 'src/components/overlay/ResponsiveSheetModal.vue')
const dockSourcePath = join(process.cwd(), 'src/components/layout/AuthenticatedDock.vue')
const sheetOpenClass = 'sophena-sheet-open'

enableAutoUnmount(afterEach)

function cssBlock(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[\\s\\S]*?)\\n\\}`))

  return match?.groups?.body ?? ''
}

function zIndexFrom(source: string, selector: string) {
  const block = cssBlock(source, selector)
  const match = block.match(/z-index:\s*(?<zIndex>\d+);/)

  return Number(match?.groups?.zIndex)
}

describe('ResponsiveSheetModal', () => {
  afterEach(() => {
    document.body.classList.remove(sheetOpenClass)
  })

  it('mantém o sheet acima do dock inferior quando está aberto', () => {
    const sheetSource = readFileSync(sheetSourcePath, 'utf8')
    const dockSource = readFileSync(dockSourcePath, 'utf8')

    expect(zIndexFrom(sheetSource, '.sheet-overlay')).toBeGreaterThan(
      zIndexFrom(dockSource, '.authenticated-dock'),
    )
  })

  it('marca a página com sheet ativo para esconder a dock inferior', async () => {
    const wrapper = mount(ResponsiveSheetModal, {
      props: {
        modelValue: true,
        title: 'Opções da lista',
      },
    })

    expect(document.body.classList.contains(sheetOpenClass)).toBe(true)

    await wrapper.setProps({ modelValue: false })

    expect(document.body.classList.contains(sheetOpenClass)).toBe(false)
  })

  it('mantém a dock escondida enquanto outro sheet continua aberto', () => {
    const firstSheet = mount(ResponsiveSheetModal, {
      props: {
        modelValue: true,
        title: 'Opções da lista',
      },
    })
    const secondSheet = mount(ResponsiveSheetModal, {
      props: {
        modelValue: true,
        title: 'Apagar lista?',
      },
    })

    firstSheet.unmount()

    expect(document.body.classList.contains(sheetOpenClass)).toBe(true)

    secondSheet.unmount()
  })

  it('declara o estado global que desativa a dock enquanto o sheet está aberto', () => {
    const dockSource = readFileSync(dockSourcePath, 'utf8')
    const inactiveDockBlock = cssBlock(dockSource, ':global(body.sophena-sheet-open) .authenticated-dock')

    expect(inactiveDockBlock).toContain('opacity: 0;')
    expect(inactiveDockBlock).toContain('pointer-events: none;')
  })

  it('renderiza um respiro inferior extra para o conteúdo do sheet', () => {
    const wrapper = mount(ResponsiveSheetModal, {
      props: {
        modelValue: true,
        title: 'Novo livro',
      },
      slots: {
        default: '<button type="button">Salvar</button>',
      },
    })

    expect(wrapper.get('[data-testid="sheet-bottom-spacer"]').attributes('aria-hidden')).toBe('true')
  })

  it('mantém o grupo de título separado do botão de fechar', () => {
    const wrapper = mount(ResponsiveSheetModal, {
      props: {
        modelValue: true,
        title: 'Adicionar livro',
        description: 'Busque pelo título ou autor. Se o livro não aparecer, você poderá cadastrar um novo.',
      },
    })

    expect(wrapper.get('[data-testid="sheet-title-group"]').text()).toContain('Adicionar livro')
    expect(wrapper.get('[data-testid="sheet-close"]').text()).toContain('Fechar')
    expect(wrapper.get('[data-testid="sheet-header"]').classes()).toContain('sheet-header')
  })

  it('renderiza a descrição em uma linha própria para aproveitar melhor a largura do sheet', () => {
    const wrapper = mount(ResponsiveSheetModal, {
      props: {
        modelValue: true,
        title: 'Opções do livro',
        description: 'Escolha o que deseja fazer com este livro.',
      },
    })

    expect(wrapper.get('[data-testid="sheet-header-description"]').text()).toBe(
      'Escolha o que deseja fazer com este livro.',
    )
  })
})
