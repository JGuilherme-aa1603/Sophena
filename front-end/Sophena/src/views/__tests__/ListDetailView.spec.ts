import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from '@ionic/vue-router'

import ListDetailView from '../ListDetailView.vue'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useListDetailStore } from '@/stores/list-detail'

describe('ListDetailView', () => {
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
  })

  it('mostra os livros da lista em ordem de posição', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    vi.spyOn(store, 'fetchListDetail').mockImplementation(async () => {
      store.list = {
        id: 'lista-1',
        name: 'Quero ler',
      }
      store.items = [
        {
          id: 'item-2',
          book_list_item_id: 'item-2',
          position: 2,
          book: {
            id: 'book-2',
            title: 'Segundo livro',
            author: 'Autora B',
            cover_url: null,
          },
        },
        {
          id: 'item-1',
          book_list_item_id: 'item-1',
          position: 1,
          book: {
            id: 'book-1',
            title: 'Primeiro livro',
            author: 'Autora A',
            cover_url: null,
          },
        },
      ]
      store.items = [...store.items].sort((left, right) => left.position - right.position)
    })

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    expect(wrapper.text()).toContain('Quero ler')
    expect(wrapper.text()).toContain('Primeiro livro')
    expect(wrapper.text()).toContain('Segundo livro')

    const renderedTitles = wrapper.findAll('[data-testid="list-item-title"]').map((node) => node.text())
    expect(renderedTitles).toEqual(['Primeiro livro', 'Segundo livro'])
  })

  it('mostra estado vazio quando a lista não tem livros', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    vi.spyOn(store, 'fetchListDetail').mockImplementation(async () => {
      store.list = {
        id: 'lista-1',
        name: 'Quero ler',
      }
      store.items = []
    })

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    expect(wrapper.text()).toContain('Esta lista ainda não tem livros.')
    expect(wrapper.text()).toContain('Quando você adicionar um livro, ele aparecerá aqui.')
  })

  it('mostra carregamento ao abrir a lista', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    store.isLoading = true
    vi.spyOn(store, 'fetchListDetail').mockResolvedValue()

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    expect(wrapper.text()).toContain('Carregando sua lista...')
  })

  it('mostra erro em português quando não consegue abrir a lista', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    store.errorMessage = 'Não foi possível abrir essa lista agora.'
    vi.spyOn(store, 'fetchListDetail').mockResolvedValue()

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    expect(wrapper.text()).toContain('Não foi possível abrir essa lista agora.')
  })

  it('remove um livro e mostra confirmação em português', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    vi.spyOn(store, 'fetchListDetail').mockImplementation(async () => {
      store.list = {
        id: 'lista-1',
        name: 'Quero ler',
      }
      store.items = [
        {
          id: 'book-1',
          book_list_item_id: 'item-1',
          position: 1,
          book: {
            id: 'book-1',
            title: 'Livro removido',
            author: 'Autora',
            cover_url: null,
          },
        },
      ]
    })
    vi.spyOn(store, 'removeItem').mockImplementation(async () => {
      store.items = []
      store.feedbackMessage = 'Livro removido da lista.'
    })

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="remove-item-item-1"]').trigger('click')
    await flushPromises()

    expect(store.removeItem).toHaveBeenCalledWith('lista-1', 'item-1')
    expect(wrapper.text()).toContain('Livro removido da lista.')
  })

  it('volta para a tela de listas', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    vi.spyOn(store, 'fetchListDetail').mockResolvedValue()

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="back-to-lists"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('app-home')
  })

  it('mostra a busca de livros existentes e permite escolher um resultado', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    vi.spyOn(store, 'fetchListDetail').mockImplementation(async () => {
      store.list = {
        id: 'lista-1',
        name: 'Quero ler',
      }
      store.items = []
    })
    const searchBooksSpy = vi.spyOn(store, 'searchBooks').mockImplementation(async () => {
      store.searchResults = [
        {
          id: 'book-1',
          title: 'Dom Casmurro',
          author: 'Machado de Assis',
          cover_url: null,
        },
      ]
    })
    const addExistingBookSpy = vi.spyOn(store, 'addExistingBook').mockResolvedValue()

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('input[name="book-search"]').setValue('Dom')
    await wrapper.get('form[data-testid="search-books-form"]').trigger('submit.prevent')
    await flushPromises()
    await wrapper.get('[data-testid="add-existing-book-book-1"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Escolher um livro já existente')
    expect(searchBooksSpy).toHaveBeenCalledWith('Dom')
    expect(addExistingBookSpy).toHaveBeenCalledWith('lista-1', 'book-1')
  })

  it('permite cadastrar um livro manualmente', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    vi.spyOn(store, 'fetchListDetail').mockImplementation(async () => {
      store.list = {
        id: 'lista-1',
        name: 'Quero ler',
      }
      store.items = []
    })
    const addManualBookSpy = vi.spyOn(store, 'addManualBook').mockResolvedValue()

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('input[name="manual-title"]').setValue('Livro Manual')
    await wrapper.get('input[name="manual-author"]').setValue('Autora Manual')
    await wrapper.get('input[name="manual-cover-url"]').setValue('https://example.com/manual.jpg')
    await wrapper.get('form[data-testid="manual-book-form"]').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Cadastrar um livro novo')
    expect(addManualBookSpy).toHaveBeenCalledWith('lista-1', {
      title: 'Livro Manual',
      author: 'Autora Manual',
      cover_url: 'https://example.com/manual.jpg',
    })
  })

  it('permite mover um livro para cima e para baixo', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    vi.spyOn(store, 'fetchListDetail').mockImplementation(async () => {
      store.list = { id: 'lista-1', name: 'Quero ler' }
      store.items = [
        {
          id: 'book-1',
          book_list_item_id: 'item-1',
          position: 1,
          book: { id: 'book-1', title: 'Primeiro', author: 'A', cover_url: null },
        },
        {
          id: 'book-2',
          book_list_item_id: 'item-2',
          position: 2,
          book: { id: 'book-2', title: 'Segundo', author: 'B', cover_url: null },
        },
      ]
    })
    const reorderSpy = vi.spyOn(store, 'reorderItem').mockResolvedValue()

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: { plugins: [router] },
    })

    await router.isReady()
    await wrapper.get('[data-testid="move-up-item-2"]').trigger('click')
    await wrapper.get('[data-testid="move-down-item-1"]').trigger('click')

    expect(reorderSpy).toHaveBeenNthCalledWith(1, 'lista-1', 'item-2', 1)
    expect(reorderSpy).toHaveBeenNthCalledWith(2, 'lista-1', 'item-1', 2)
  })

  it('carrega listas e permite mover um livro para outra lista', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    vi.spyOn(store, 'fetchListDetail').mockImplementation(async () => {
      store.list = { id: 'lista-1', name: 'Quero ler' }
      store.items = [
        {
          id: 'book-1',
          book_list_item_id: 'item-1',
          position: 1,
          book: { id: 'book-1', title: 'Primeiro', author: 'A', cover_url: null },
        },
      ]
    })
    vi.spyOn(store, 'fetchAvailableLists').mockImplementation(async () => {
      store.availableLists = [
        { id: 'lista-1', name: 'Quero ler', created_at: '2026-01-01T10:00:00.000Z', updated_at: '2026-01-01T10:00:00.000Z' },
        { id: 'lista-2', name: 'Lidos', created_at: '2026-01-01T11:00:00.000Z', updated_at: '2026-01-01T11:00:00.000Z' },
      ]
    })
    const moveSpy = vi.spyOn(store, 'moveItemToList').mockResolvedValue()

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: { plugins: [router] },
    })

    await router.isReady()
    await wrapper.get('[data-testid="open-move-item-1"]').trigger('click')
    await flushPromises()
    await wrapper.get('select[name="target-list-item-1"]').setValue('lista-2')
    await wrapper.get('[data-testid="confirm-move-item-1"]').trigger('click')

    expect(store.fetchAvailableLists).toHaveBeenCalled()
    expect(moveSpy).toHaveBeenCalledWith('lista-1', 'item-1', 'lista-2', 1)
  })
})
