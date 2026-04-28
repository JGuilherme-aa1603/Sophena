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

  it('apaga o livro diretamente quando a confirmação extra não é necessária', async () => {
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
    await wrapper.get('[data-testid="delete-book-book-1"]').trigger('click')

    expect(requestDeleteBookSpy).toHaveBeenCalledWith('book-1')
  })

  it('pede confirmação e apaga com força quando o admin aceita', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
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
    await wrapper.get('[data-testid="delete-book-book-1"]').trigger('click')

    expect(confirmSpy).toHaveBeenCalledWith('Esse livro está em 2 listas. Se continuar, ele será removido dessas listas e apagado do sistema. Deseja continuar?')
    expect(confirmDeleteBookSpy).toHaveBeenCalledWith('book-1')
  })

  it('pede confirmação e não apaga com força quando o admin cancela', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
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
    await wrapper.get('[data-testid="delete-book-book-1"]').trigger('click')

    expect(confirmSpy).toHaveBeenCalled()
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
