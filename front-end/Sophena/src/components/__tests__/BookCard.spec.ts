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
    expect(wrapper.get('[data-testid="book-card"]').classes()).toContain('book-card--comfortable')
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
    expect(wrapper.get('[data-testid="book-card"]').classes()).toContain('book-card')
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
    expect(wrapper.find('[data-testid="book-card-details"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="book-card-main"]').exists()).toBe(true)
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

  it('mantém a estrutura de capa e conteúdo quando tem imagem ou fallback', () => {
    const withImage = mount(BookCard, {
      props: {
        title: 'Livro com capa',
        author: 'Autora',
        coverUrl: 'https://example.com/capa.webp',
      },
    })

    const withFallback = mount(BookCard, {
      props: {
        title: 'Livro sem capa',
        author: 'Autora',
        coverUrl: null,
      },
    })

    expect(withImage.find('.book-card-cover').exists()).toBe(true)
    expect(withImage.find('.book-card-content').exists()).toBe(true)
    expect(withImage.find('[data-testid="book-card-media"]').exists()).toBe(true)
    expect(withImage.get('[data-testid="book-card-author"]').text()).toBe('Autora')
    expect(withFallback.find('.book-card-cover').exists()).toBe(true)
    expect(withFallback.find('.book-card-content').exists()).toBe(true)
    expect(withFallback.find('[data-testid="book-card-media"]').exists()).toBe(true)
  })

  it('mantém título e autor ao lado da capa com a ação separada de forma compacta', () => {
    const wrapper = mount(BookCard, {
      props: {
        title: 'Livro com ação',
        author: 'Autora',
        coverUrl: null,
        position: 1,
        showPosition: true,
      },
      slots: {
        actions: '<button type="button" aria-label="Abrir opções">...</button>',
      },
    })

    expect(wrapper.find('[data-testid="book-card-main"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="book-card-details"]').text()).toContain('Livro com ação')
    expect(wrapper.get('[data-testid="book-card-author"]').text()).toBe('Autora')
    expect(wrapper.get('[data-testid="book-card-actions"]').attributes('aria-label')).toBeUndefined()
    expect(wrapper.get('[data-testid="book-card-actions"]').text()).toContain('...')
    expect(wrapper.get('[data-testid="book-card-position"]').text()).toBe('1')
  })

  it('renderiza a variante compacta com título e autor abaixo da capa', () => {
    const wrapper = mount(BookCard, {
      props: {
        title: 'Livro compacto',
        author: 'Autora compacta',
        coverUrl: 'https://example.com/capa-compacta.webp',
        position: 2,
        showPosition: true,
        layout: 'compact',
      },
      slots: {
        actions: '<button type="button" aria-label="Abrir opções">...</button>',
      },
    })

    expect(wrapper.get('[data-testid="book-card"]').classes()).toContain('book-card--compact')
    expect(wrapper.get('[data-testid="book-card-title"]').text()).toBe('Livro compacto')
    expect(wrapper.get('[data-testid="book-card-author"]').text()).toBe('Autora compacta')
    expect(wrapper.get('[data-testid="book-card-position"]').text()).toBe('2')
  })

  it('mantém um fallback amigável no modo compacto quando não há capa', () => {
    const wrapper = mount(BookCard, {
      props: {
        title: 'Livro sem imagem',
        author: 'Autora sem imagem',
        coverUrl: null,
        layout: 'compact',
      },
    })

    expect(wrapper.get('[data-testid="book-card-cover-fallback"]').text()).toContain('Sem capa')
    expect(wrapper.get('[data-testid="book-card"]').classes()).toContain('book-card--compact')
    expect(wrapper.get('[data-testid="book-card-cover-fallback"]').classes()).toContain('book-card-cover-fallback--centered')
  })
})
