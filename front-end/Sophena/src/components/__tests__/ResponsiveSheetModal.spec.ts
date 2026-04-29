import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ResponsiveSheetModal from '../overlay/ResponsiveSheetModal.vue'

describe('ResponsiveSheetModal', () => {
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
