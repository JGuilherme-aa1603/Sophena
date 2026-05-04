import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from '@ionic/vue-router'

import ListDetailView from '../ListDetailView.vue'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useListDetailStore } from '@/stores/list-detail'
import { useListsStore } from '@/stores/lists'

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
    localStorage.clear()
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
            cover_url: 'https://example.com/capas/primeiro-livro.webp',
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

    const renderedTitles = wrapper.findAll('[data-testid="book-card-title"]').map((node) => node.text())
    expect(renderedTitles).toEqual(['Primeiro livro', 'Segundo livro'])
    const bookCards = wrapper.findAll('[data-testid="book-card"]')
    expect(bookCards).toHaveLength(2)
    const firstCover = bookCards[0]!.get('[data-testid="book-card-cover-image"]')
    expect(firstCover.attributes('src')).toBe('https://example.com/capas/primeiro-livro.webp')
    expect(firstCover.attributes('alt')).toBe('Primeiro livro')
    expect(bookCards[0]!.get('[data-testid="book-card-position"]').text()).toBe('1')
    expect(wrapper.find('[data-testid="books-controls-panel"]').exists()).toBe(false)
    await wrapper.get('[data-testid="books-controls-toggle"]').trigger('click')
    expect(wrapper.get('[data-testid="books-layout-comfortable"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="books-list"]').classes()).toContain('items-list--comfortable')
  })

  it('recarrega os dados quando a pessoa troca para outra lista na mesma tela', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    const fetchListDetailSpy = vi.spyOn(store, 'fetchListDetail').mockImplementation(async (listId) => {
      store.list = {
        id: listId,
        name: listId === 'lista-2' ? 'Lidos' : 'Quero ler',
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
    await flushPromises()
    expect(wrapper.text()).toContain('Quero ler')

    await router.push('/app/lists/lista-2')
    await flushPromises()

    expect(fetchListDetailSpy).toHaveBeenLastCalledWith('lista-2')
    expect(wrapper.text()).toContain('Lidos')
    expect(wrapper.text()).not.toContain('Quero ler')
  })

  it('mostra o nome da nova lista sem esperar o carregamento dos livros terminar', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const listsStore = useListsStore()
    listsStore.items = [
      {
        id: 'lista-1',
        name: 'Quero ler',
        icon: 'bookmark',
        tint_index: 0,
        preview_items: [],
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-01T10:00:00.000Z',
      },
      {
        id: 'lista-2',
        name: 'Lidos',
        icon: 'bookmark',
        tint_index: 0,
        preview_items: [],
        created_at: '2026-01-01T11:00:00.000Z',
        updated_at: '2026-01-01T11:00:00.000Z',
      },
    ]
    const store = useListDetailStore()
    store.list = {
      id: 'lista-1',
      name: 'Quero ler',
    }
    vi.spyOn(store, 'fetchListDetail').mockImplementation(() => new Promise(() => {}))

    await router.push('/app/lists/lista-2')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()

    expect(wrapper.get('.app-page-title').text()).toBe('Lidos')
    expect(wrapper.text()).not.toContain('Quero ler')
  })

  it('não mostra aviso antigo de sessão expirada enquanto a lista carrega novamente', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    store.errorMessage = 'Sua sessão expirou. Entre novamente.'
    vi.spyOn(store, 'fetchListDetail').mockImplementation(() => {
      store.isLoading = true
      store.errorMessage = ''
      return new Promise(() => {})
    })

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await flushPromises()

    expect(wrapper.text()).toContain('Carregando sua lista...')
    expect(wrapper.text()).not.toContain('Sua sessão expirou. Entre novamente.')
  })

  it('permite alternar para o layout compacto e salva a preferência', async () => {
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
      ]
    })

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="books-controls-toggle"]').trigger('click')
    await wrapper.get('[data-testid="books-layout-compact"]').trigger('click')

    expect(wrapper.get('[data-testid="books-layout-compact"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="books-list"]').classes()).toContain('items-list--compact')
    expect(wrapper.findAll('.items-list--compact .item-card')).toHaveLength(2)
    expect(localStorage.getItem('sophena:list-books-layout')).toBe('compact')
    const firstCard = wrapper.get('[data-testid="book-card"]')
    expect(firstCard.classes()).toContain('book-card--compact')
    expect(firstCard.get('[data-testid="book-card-position"]').attributes('data-placement')).toBe('cover-overlay')
    expect(firstCard.get('[data-testid="book-card-actions"]').attributes('data-placement')).toBe('cover-overlay')
  })

  it('restaura o layout salvo ao abrir a lista novamente', async () => {
    localStorage.setItem('sophena:list-books-layout', 'compact')

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
          id: 'item-1',
          book_list_item_id: 'item-1',
          position: 1,
          book: {
            id: 'book-1',
            title: 'Livro salvo',
            author: 'Autora salva',
            cover_url: null,
          },
        },
      ]
    })

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="books-controls-toggle"]').trigger('click')

    expect(wrapper.get('[data-testid="books-layout-compact"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-testid="books-list"]').classes()).toContain('items-list--compact')
    expect(wrapper.get('[data-testid="book-card"]').classes()).toContain('book-card--compact')
  })

  it('mostra um espaço de capa quando o livro não tem imagem', async () => {
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
          id: 'item-1',
          book_list_item_id: 'item-1',
          position: 1,
          book: {
            id: 'book-1',
            title: 'Livro sem capa',
            author: 'Autora A',
            cover_url: null,
          },
        },
      ]
    })

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()

    const card = wrapper.get('[data-testid="book-card"]')
    expect(card.get('[data-testid="book-card-cover-fallback"]').text()).toContain('Livro sem capa')
    expect(card.find('[data-testid="book-card-cover-image"]').exists()).toBe(false)
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
    expect(wrapper.get('[data-testid="empty-open-add-book"]').text()).toContain('Adicionar o primeiro livro')
  })

  it('filtra os livros da lista e restaura a ordenação própria ao limpar filtros', async () => {
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
        {
          id: 'item-2',
          book_list_item_id: 'item-2',
          position: 2,
          book: {
            id: 'book-2',
            title: 'Segundo livro',
            author: 'Autora B',
            cover_url: 'https://example.com/segundo.webp',
          },
        },
        {
          id: 'item-3',
          book_list_item_id: 'item-3',
          position: 3,
          book: {
            id: 'book-3',
            title: 'Terceiro livro',
            author: 'Autora B',
            cover_url: null,
          },
        },
      ]
    })

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="books-controls-toggle"]').trigger('click')
    await wrapper.get('input[name="book-search"]').setValue('livro')
    await wrapper.get('input[name="book-author"]').setValue('Autora B')
    await wrapper.get('select[name="book-cover"]').setValue('without')
    await wrapper.get('form[data-testid="books-filters-form"]').trigger('submit.prevent')

    expect(wrapper.findAll('[data-testid="book-card-title"]').map((node) => node.text())).toEqual([
      'Terceiro livro',
    ])

    await wrapper.get('[data-testid="clear-books-filters"]').trigger('click')

    expect(wrapper.findAll('[data-testid="book-card-title"]').map((node) => node.text())).toEqual([
      'Primeiro livro',
      'Segundo livro',
      'Terceiro livro',
    ])
    expect(wrapper.findAll('[data-testid="book-card-position"]').map((node) => node.text())).toEqual(['1', '2', '3'])
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

  it('não repete no aviso fixo a mensagem de livro já existente na lista', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const store = useListDetailStore()
    store.list = {
      id: 'lista-1',
      name: 'Quero ler',
    }
    store.items = []
    store.errorMessage = 'Esse livro já está nesta lista.'
    vi.spyOn(store, 'fetchListDetail').mockResolvedValue()

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()

    expect(wrapper.text()).not.toContain('Esse livro já está nesta lista.')
    expect(wrapper.find('.app-feedback--error').exists()).toBe(false)
  })

  it('abre opções do livro e remove somente depois da confirmação em português', async () => {
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

    expect(wrapper.find('[data-testid="move-up-item-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="remove-item-item-1"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="open-book-options-item-1"]').attributes('aria-label')).toBe('Ver opções do livro Livro removido')

    await wrapper.get('[data-testid="open-book-options-item-1"]').trigger('click')
    expect(wrapper.get('[data-testid="book-options-sheet"]').text()).toContain('Opções do livro')
    expect(wrapper.get('[data-testid="book-options-sheet"]').text()).toContain('Livro removido')
    expect(wrapper.find('[data-testid="book-options-bottom-spacer"]').exists()).toBe(true)

    await wrapper.get('[data-testid="request-remove-item-1"]').trigger('click')
    expect(wrapper.get('[data-testid="remove-book-confirm-sheet"]').text()).toContain('Remover livro da lista?')
    expect(wrapper.get('[data-testid="remove-book-confirm-sheet"]').text()).toContain('O livro sairá desta lista, mas continuará cadastrado no Sophena.')
    expect(store.removeItem).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="confirm-sheet-confirm"]').trigger('click')
    await flushPromises()

    expect(store.removeItem).toHaveBeenCalledWith('lista-1', 'item-1')
    expect(wrapper.text()).toContain('Livro removido da lista.')
    expect(wrapper.find('.app-feedback--success').exists()).toBe(false)
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
    await wrapper.get('[data-testid="open-add-book-flow"]').trigger('click')
    expect(wrapper.find('form[data-testid="manual-book-form"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="show-manual-book-form"]').exists()).toBe(false)

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
    vi.spyOn(store, 'searchBooks').mockImplementation(async () => {
      store.searchResults = []
    })
    const addManualBookSpy = vi.spyOn(store, 'addManualBook').mockResolvedValue()

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="open-add-book-flow"]').trigger('click')
    await wrapper.get('input[name="book-search"]').setValue('Livro Manual')
    await wrapper.get('form[data-testid="search-books-form"]').trigger('submit.prevent')
    await flushPromises()
    expect(wrapper.get('[data-testid="manual-path-message"]').text()).toContain('Não encontramos esse livro por aqui.')
    expect(wrapper.get('[data-testid="show-manual-book-form"]').text()).toContain('Cadastrar livro manualmente')
    await wrapper.get('[data-testid="show-manual-book-form"]').trigger('click')
    expect(wrapper.text()).toContain('Cadastrar um livro novo')
    expect(wrapper.find('input[name="manual-cover-url"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="manual-cover-picker-trigger"]').text()).toContain('Escolher imagem')
    expect(wrapper.get('[data-testid="manual-cover-picker-status"]').text()).toContain('Nenhuma imagem escolhida')

    await wrapper.get('input[name="manual-title"]').setValue('Livro Manual')
    await wrapper.get('input[name="manual-author"]').setValue('Autora Manual')
    await wrapper.get('form[data-testid="manual-book-form"]').trigger('submit.prevent')

    expect(addManualBookSpy).toHaveBeenCalledWith('lista-1', {
      title: 'Livro Manual',
      author: 'Autora Manual',
      cover_file: undefined,
    })
  })

  it('permite cadastrar um livro manualmente com arquivo de capa', async () => {
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
    vi.spyOn(store, 'searchBooks').mockImplementation(async () => {
      store.searchResults = []
    })
    const addManualBookSpy = vi.spyOn(store, 'addManualBook').mockResolvedValue()
    const coverFile = new File(['capa'], 'capa.png', { type: 'image/png' })

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="open-add-book-flow"]').trigger('click')
    await wrapper.get('input[name="book-search"]').setValue('Livro com Capa')
    await wrapper.get('form[data-testid="search-books-form"]').trigger('submit.prevent')
    await flushPromises()
    await wrapper.get('[data-testid="show-manual-book-form"]').trigger('click')
    await wrapper.get('input[name="manual-title"]').setValue('Livro com Capa')
    await wrapper.get('input[name="manual-author"]').setValue('Autora com Capa')
    expect(wrapper.find('input[name="manual-cover-url"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="manual-cover-picker-status"]').text()).toContain('Nenhuma imagem escolhida')
    const coverFileInput = wrapper.get('input[name="manual-cover-file"]')
    Object.defineProperty(coverFileInput.element, 'files', {
      value: [coverFile],
      configurable: true,
    })
    await coverFileInput.trigger('change')
    expect(wrapper.get('[data-testid="manual-cover-picker-status"]').text()).toContain('capa.png')
    await wrapper.get('form[data-testid="manual-book-form"]').trigger('submit.prevent')

    expect(addManualBookSpy).toHaveBeenCalledWith('lista-1', {
      title: 'Livro com Capa',
      author: 'Autora com Capa',
      cover_file: coverFile,
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
    await wrapper.get('[data-testid="open-book-options-item-2"]').trigger('click')
    await wrapper.get('[data-testid="move-up-item-2"]').trigger('click')
    await wrapper.get('[data-testid="open-book-options-item-1"]').trigger('click')
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
        { id: 'lista-1', name: 'Quero ler', icon: 'bookmark', tint_index: 0, preview_items: [], created_at: '2026-01-01T10:00:00.000Z', updated_at: '2026-01-01T10:00:00.000Z' },
        { id: 'lista-2', name: 'Lidos', icon: 'bookmark', tint_index: 0, preview_items: [], created_at: '2026-01-01T11:00:00.000Z', updated_at: '2026-01-01T11:00:00.000Z' },
      ]
    })
    const moveSpy = vi.spyOn(store, 'moveItemToList').mockResolvedValue()

    await router.push('/app/lists/lista-1')

    const wrapper = mount(ListDetailView, {
      global: { plugins: [router] },
    })

    await router.isReady()
    await wrapper.get('[data-testid="open-book-options-item-1"]').trigger('click')
    await wrapper.get('[data-testid="open-move-item-1"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="move-book-flow"]').text()).toContain('Enviar livro para outra lista')
    await wrapper.get('select[name="target-list-item-1"]').setValue('lista-2')
    await wrapper.get('[data-testid="confirm-move-item-1"]').trigger('click')

    expect(store.fetchAvailableLists).toHaveBeenCalled()
    expect(moveSpy).toHaveBeenCalledWith('lista-1', 'item-1', 'lista-2', 1)
  })
})
