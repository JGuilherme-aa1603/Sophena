import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from '@ionic/vue-router'

import BooksView from '../BooksView.vue'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'

describe('BooksView', () => {
  function authenticateUser() {
    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('carrega livros ao abrir a tela pública de livros', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useBooksStore()
    const fetchBooksSpy = vi.spyOn(store, 'fetchBooks').mockImplementation(async () => {
      store.books = [
        {
          id: 'book-1',
          title: 'Dom Casmurro',
          author: 'Machado de Assis',
          cover_url: null,
        },
        {
          id: 'book-2',
          title: 'A Hora da Estrela',
          author: 'Clarice Lispector',
          cover_url: 'https://example.com/estrela.jpg',
        },
      ]
    })

    await router.push('/app/books')

    const wrapper = mount(BooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()

    expect(fetchBooksSpy).toHaveBeenCalledWith()
    expect(wrapper.text()).toContain('Livros do sistema')
    expect(wrapper.text()).toContain('Dom Casmurro')
    expect(wrapper.text()).toContain('Machado de Assis')
    expect(wrapper.get('[data-testid="book-card-cover-fallback"]').text()).toContain('Dom Casmurro')
    expect(wrapper.text()).toContain('A Hora da Estrela')
  })

  it('envia pesquisa e filtros preenchidos', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useBooksStore()
    const fetchBooksSpy = vi.spyOn(store, 'fetchBooks').mockResolvedValue()

    await router.push('/app/books')

    const wrapper = mount(BooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('input[name="book-search"]').setValue('Dom')
    await wrapper.get('input[name="book-author"]').setValue('Machado')
    await wrapper.get('select[name="book-cover"]').setValue('without')
    await wrapper.get('form[data-testid="books-filters-form"]').trigger('submit.prevent')

    expect(fetchBooksSpy).toHaveBeenLastCalledWith({
      search: 'Dom',
      author: 'Machado',
      cover: 'without',
    })
  })

  it('limpa filtros pela ação da tela', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useBooksStore()
    vi.spyOn(store, 'fetchBooks').mockResolvedValue()
    const clearFiltersSpy = vi.spyOn(store, 'clearFilters').mockResolvedValue()

    await router.push('/app/books')

    const wrapper = mount(BooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('input[name="book-search"]').setValue('Dom')
    await wrapper.get('input[name="book-author"]').setValue('Machado')
    await wrapper.get('select[name="book-cover"]').setValue('with')
    await wrapper.get('[data-testid="clear-books-filters"]').trigger('click')

    expect(clearFiltersSpy).toHaveBeenCalled()
    expect((wrapper.get('input[name="book-search"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('input[name="book-author"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('select[name="book-cover"]').element as HTMLSelectElement).value).toBe('all')
  })

  it('alterna para o layout compacto e salva a preferência', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useBooksStore()
    vi.spyOn(store, 'fetchBooks').mockImplementation(async () => {
      store.books = [
        {
          id: 'book-1',
          title: 'Dom Casmurro',
          author: 'Machado de Assis',
          cover_url: null,
        },
      ]
    })

    await router.push('/app/books')

    const wrapper = mount(BooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()
    await wrapper.get('[data-testid="books-layout-compact"]').trigger('click')

    expect(wrapper.get('[data-testid="books-layout-compact"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="books-list"]').classes()).toContain('books-list--compact')
    expect(wrapper.get('[data-testid="book-card"]').classes()).toContain('book-card--compact')
    expect(localStorage.getItem('sophena:books-layout')).toBe('compact')
  })

  it('restaura o layout salvo ao abrir a tela', async () => {
    localStorage.setItem('sophena:books-layout', 'compact')
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useBooksStore()
    vi.spyOn(store, 'fetchBooks').mockImplementation(async () => {
      store.books = [
        {
          id: 'book-1',
          title: 'Dom Casmurro',
          author: 'Machado de Assis',
          cover_url: null,
        },
      ]
    })

    await router.push('/app/books')

    const wrapper = mount(BooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()

    expect(wrapper.get('[data-testid="books-layout-compact"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="books-list"]').classes()).toContain('books-list--compact')
  })

  it('mostra estado vazio quando nenhum livro é encontrado', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useBooksStore()
    vi.spyOn(store, 'fetchBooks').mockImplementation(async () => {
      store.books = []
    })

    await router.push('/app/books')

    const wrapper = mount(BooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()

    expect(wrapper.text()).toContain('Nenhum livro foi encontrado.')
  })
})
