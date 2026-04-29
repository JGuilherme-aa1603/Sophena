import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BookCard from '../books/BookCard.vue'

describe('BookCard', () => {
  it('renderiza a capa quando o livro tem imagem', () => {
    const wrapper = mount(BookCard, {
      props: {
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        coverUrl: 'https://example.com/capas/dom-casmurro.webp',
        position: 1,
        showPosition: true,
      },
    })

    const image = wrapper.get('[data-testid="book-card-cover-image"]')

    expect(image.attributes('src')).toBe('https://example.com/capas/dom-casmurro.webp')
    expect(image.attributes('alt')).toBe('Capa do livro Dom Casmurro')
  })

  it('renderiza o fallback quando o livro não tem capa', () => {
    const wrapper = mount(BookCard, {
      props: {
        title: 'Livro sem capa',
        author: 'Autora',
        coverUrl: null,
      },
    })

    expect(wrapper.get('[data-testid="book-card-cover-fallback"]').text()).toContain('Sem capa')
    expect(wrapper.find('[data-testid="book-card-cover-image"]').exists()).toBe(false)
  })

  it('mostra a posição quando configurado', () => {
    const wrapper = mount(BookCard, {
      props: {
        title: 'Livro ordenado',
        author: 'Autora',
        coverUrl: null,
        position: 3,
        showPosition: true,
      },
    })

    expect(wrapper.get('[data-testid="book-card-position"]').text()).toBe('3')
  })

  it('não mostra a posição quando desabilitado', () => {
    const wrapper = mount(BookCard, {
      props: {
        title: 'Livro administrativo',
        author: 'Autora',
        coverUrl: null,
        position: 2,
        showPosition: false,
      },
    })

    expect(wrapper.find('[data-testid="book-card-position"]').exists()).toBe(false)
  })

  it('renderiza o slot de ações', () => {
    const wrapper = mount(BookCard, {
      props: {
        title: 'Livro com ação',
        author: 'Autora',
        coverUrl: null,
      },
      slots: {
        actions: '<button type="button">Ação de teste</button>',
      },
    })

    expect(wrapper.get('[data-testid="book-card-actions"]').text()).toContain('Ação de teste')
  })

  it('expõe estilo interativo quando tem ações disponíveis', () => {
    const wrapper = mount(BookCard, {
      props: {
        title: 'Livro com ação',
        author: 'Autora',
        coverUrl: null,
      },
      slots: {
        actions: '<button type="button">Ação de teste</button>',
      },
    })

    expect(wrapper.get('[data-testid="book-card"]').classes()).toContain('book-card--interactive')
  })
})
