import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from '@ionic/vue-router'

import AdminBooksView from '../AdminBooksView.vue'
import { createAppRouter } from '@/router'
import { useAdminBooksStore } from '@/stores/admin-books'
import { useAuthStore } from '@/stores/auth'

describe('AdminBooksView', () => {
  function authenticateAdmin() {
    const authStore = useAuthStore()
    authStore.setAccessToken('token-admin')
    authStore.user = {
      id: 'admin-1',
      user_name: 'admin',
      is_admin: true,
    }
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('carrega livros e mostra estado vazio quando não há resultados', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminBooksStore()
    vi.spyOn(store, 'fetchBooks').mockImplementation(async () => {
      store.books = []
    })

    await router.push('/app/admin/books')

    const wrapper = mount(AdminBooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()

    expect(wrapper.text()).toContain('Nenhum livro foi encontrado.')
  })

  it('busca livros pelo termo informado', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminBooksStore()
    const fetchBooksSpy = vi.spyOn(store, 'fetchBooks').mockResolvedValue()

    await router.push('/app/admin/books')

    const wrapper = mount(AdminBooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('input[name="admin-book-search"]').setValue('Dom')
    await wrapper.get('form[data-testid="admin-books-search-form"]').trigger('submit.prevent')

    expect(fetchBooksSpy).toHaveBeenLastCalledWith('Dom')
  })

  it('isola a ação apagar em opções e confirma antes de apagar', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminBooksStore()
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
    const requestDeleteBookSpy = vi.spyOn(store, 'requestDeleteBook').mockResolvedValue()

    await router.push('/app/admin/books')

    const wrapper = mount(AdminBooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()
    const card = wrapper.get('[data-testid="book-card"]')
    expect(card.text()).toContain('Dom Casmurro')
    expect(card.text()).toContain('Machado de Assis')
    expect(card.get('[data-testid="book-card-cover-fallback"]').text()).toContain('Sem capa')
    expect(card.find('[data-testid="book-card-position"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="admin-books-layout-comfortable"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="admin-books-list"]').classes()).toContain('books-list--comfortable')
    expect(wrapper.find('[data-testid="delete-book-book-1"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="open-admin-book-options-book-1"]').attributes('aria-label')).toBe('Ver opções do livro Dom Casmurro')

    await wrapper.get('[data-testid="open-admin-book-options-book-1"]').trigger('click')
    expect(wrapper.get('[data-testid="admin-book-options-sheet"]').text()).toContain('Opções do livro')
    expect(wrapper.find('[data-testid="admin-book-options-bottom-spacer"]').exists()).toBe(true)
    await wrapper.get('[data-testid="request-delete-book-book-1"]').trigger('click')
    expect(wrapper.get('[data-testid="admin-delete-book-confirm-sheet"]').text()).toContain('Apagar livro do sistema?')
    expect(wrapper.find('[data-testid="confirm-sheet-bottom-spacer"]').exists()).toBe(true)
    expect(requestDeleteBookSpy).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="confirm-sheet-confirm"]').trigger('click')

    expect(requestDeleteBookSpy).toHaveBeenCalledWith('book-1')
  })

  it('permite alternar para o layout compacto e salva a preferência', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminBooksStore()
    vi.spyOn(store, 'fetchBooks').mockImplementation(async () => {
      store.books = [
        {
          id: 'book-1',
          title: 'Dom Casmurro',
          author: 'Machado de Assis',
          cover_url: null,
        },
        {
          id: 'book-2',
          title: 'Drácula',
          author: 'Bram Stoker',
          cover_url: null,
        },
      ]
    })

    await router.push('/app/admin/books')

    const wrapper = mount(AdminBooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()
    await wrapper.get('[data-testid="admin-books-layout-compact"]').trigger('click')

    expect(wrapper.get('[data-testid="admin-books-layout-compact"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="admin-books-list"]').classes()).toContain('books-list--compact')
    expect(localStorage.getItem('sophena:admin-books-layout')).toBe('compact')
    expect(wrapper.get('[data-testid="book-card"]').classes()).toContain('book-card--compact')
  })

  it('restaura o layout salvo ao abrir a lista de livros do admin', async () => {
    localStorage.setItem('sophena:admin-books-layout', 'compact')

    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminBooksStore()
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

    await router.push('/app/admin/books')

    const wrapper = mount(AdminBooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()

    expect(wrapper.get('[data-testid="admin-books-layout-compact"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="admin-books-list"]').classes()).toContain('books-list--compact')
    expect(wrapper.get('[data-testid="book-card"]').classes()).toContain('book-card--compact')
  })

  it('pede confirmação e apaga com força quando o admin aceita', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminBooksStore()
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
    vi.spyOn(store, 'requestDeleteBook').mockImplementation(async () => {
      store.pendingDeletion = {
        bookId: 'book-1',
        removedFromListsCount: 2,
      }
      throw new Error('confirmation required')
    })
    const confirmDeleteBookSpy = vi.spyOn(store, 'confirmDeleteBook').mockResolvedValue()

    await router.push('/app/admin/books')

    const wrapper = mount(AdminBooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()
    await wrapper.get('[data-testid="open-admin-book-options-book-1"]').trigger('click')
    await wrapper.get('[data-testid="request-delete-book-book-1"]').trigger('click')
    await wrapper.get('[data-testid="confirm-sheet-confirm"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="admin-delete-book-confirm-sheet"]').text()).toContain('Esse livro está em 2 listas.')
    await wrapper.get('[data-testid="confirm-sheet-confirm"]').trigger('click')

    expect(confirmDeleteBookSpy).toHaveBeenCalledWith('book-1')
  })

  it('pede confirmação e não apaga com força quando o admin cancela', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminBooksStore()
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
    vi.spyOn(store, 'requestDeleteBook').mockImplementation(async () => {
      store.pendingDeletion = {
        bookId: 'book-1',
        removedFromListsCount: 1,
      }
      throw new Error('confirmation required')
    })
    const confirmDeleteBookSpy = vi.spyOn(store, 'confirmDeleteBook').mockResolvedValue()
    const clearPendingDeletionSpy = vi.spyOn(store, 'clearPendingDeletion').mockImplementation(() => {
      store.pendingDeletion = null
    })

    await router.push('/app/admin/books')

    const wrapper = mount(AdminBooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()
    await wrapper.get('[data-testid="open-admin-book-options-book-1"]').trigger('click')
    await wrapper.get('[data-testid="request-delete-book-book-1"]').trigger('click')
    await wrapper.get('[data-testid="confirm-sheet-confirm"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="admin-delete-book-confirm-sheet"]').text()).toContain('Esse livro está em 1 lista.')
    await wrapper.get('[data-testid="confirm-sheet-cancel"]').trigger('click')

    expect(confirmDeleteBookSpy).not.toHaveBeenCalled()
    expect(clearPendingDeletionSpy).toHaveBeenCalledTimes(1)
  })

  it('volta para a área administrativa', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminBooksStore()
    vi.spyOn(store, 'fetchBooks').mockResolvedValue()

    await router.push('/app/admin/books')

    const wrapper = mount(AdminBooksView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="back-to-admin-home"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-home')
  })
})
