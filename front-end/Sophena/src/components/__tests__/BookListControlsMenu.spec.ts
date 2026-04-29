import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import BookListControlsMenu from '@/components/books/BookListControlsMenu.vue'

describe('BookListControlsMenu', () => {
  it('começa fechado e abre ou fecha pelo botão de filtros', async () => {
    const wrapper = mount(BookListControlsMenu, {
      props: {
        layout: 'comfortable',
        testIdPrefix: 'books',
      },
    })

    expect(wrapper.get('[data-testid="books-controls-toggle"]').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[data-testid="books-controls-panel"]').exists()).toBe(false)

    await wrapper.get('[data-testid="books-controls-toggle"]').trigger('click')

    expect(wrapper.get('[data-testid="books-controls-toggle"]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[data-testid="books-controls-panel"]').text()).toContain('Buscar livro')

    await wrapper.get('[data-testid="books-controls-toggle"]').trigger('click')

    expect(wrapper.get('[data-testid="books-controls-toggle"]').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[data-testid="books-controls-panel"]').exists()).toBe(false)
  })

  it('envia busca com termo, autor e filtro de capa', async () => {
    const wrapper = mount(BookListControlsMenu, {
      props: {
        layout: 'comfortable',
        testIdPrefix: 'books',
      },
    })

    await wrapper.get('[data-testid="books-controls-toggle"]').trigger('click')
    await wrapper.get('input[name="book-search"]').setValue('Dom')
    await wrapper.get('input[name="book-author"]').setValue('Machado')
    await wrapper.get('select[name="book-cover"]').setValue('without')
    await wrapper.get('[data-testid="books-filters-form"]').trigger('submit.prevent')

    expect(wrapper.emitted('search')?.[0]).toEqual([
      {
        search: 'Dom',
        author: 'Machado',
        cover: 'without',
      },
    ])
  })

  it('limpa os filtros e emite a ação de limpeza', async () => {
    const wrapper = mount(BookListControlsMenu, {
      props: {
        layout: 'comfortable',
        testIdPrefix: 'books',
      },
    })

    await wrapper.get('[data-testid="books-controls-toggle"]').trigger('click')
    await wrapper.get('input[name="book-search"]').setValue('Dom')
    await wrapper.get('input[name="book-author"]').setValue('Machado')
    await wrapper.get('select[name="book-cover"]').setValue('with')
    await wrapper.get('[data-testid="clear-books-filters"]').trigger('click')

    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect((wrapper.get('input[name="book-search"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('input[name="book-author"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('select[name="book-cover"]').element as HTMLSelectElement).value).toBe('all')
  })

  it('emite a mudança de visualização', async () => {
    const wrapper = mount(BookListControlsMenu, {
      props: {
        layout: 'comfortable',
        testIdPrefix: 'books',
      },
    })

    await wrapper.get('[data-testid="books-controls-toggle"]').trigger('click')
    await wrapper.get('[data-testid="books-layout-compact"]').trigger('click')

    expect(wrapper.emitted('update:layout')?.[0]).toEqual(['compact'])
  })
})
