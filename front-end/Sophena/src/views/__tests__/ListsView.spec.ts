import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from '@ionic/vue-router'

import ListsView from '../ListsView.vue'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useListsStore } from '@/stores/lists'
import { useToastStore } from '@/stores/toast'

describe('ListsView', () => {
  function authenticateUser() {
    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }

    return authStore
  }

  function authenticateAdmin() {
    const authStore = useAuthStore()
    authStore.setAccessToken('token-admin')
    authStore.user = {
      id: 'admin-1',
      user_name: 'admin',
      is_admin: true,
    }

    return authStore
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('mostra estado vazio quando não há listas', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockImplementation(async () => {
      listsStore.items = []
    })

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()

    expect(wrapper.text()).toContain('Você ainda não criou nenhuma lista.')
    expect(wrapper.text()).toContain('Crie sua primeira lista para começar.')
    expect(wrapper.get('[data-testid="empty-create-list"]').text()).toContain('Criar minha primeira lista')
  })

  it('mostra carregamento ao buscar listas', () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const listsStore = useListsStore()
    listsStore.isLoading = true
    vi.spyOn(listsStore, 'fetchLists').mockResolvedValue()

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Carregando suas listas...')
    expect(wrapper.get('[data-testid="lists-loading-skeleton"]').findAll('[data-testid="skeleton-block"]')).toHaveLength(3)
  })

  it('mostra erro em português quando não consegue carregar listas', () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const listsStore = useListsStore()
    listsStore.errorMessage = 'Não foi possível carregar suas listas agora.'
    vi.spyOn(listsStore, 'fetchLists').mockResolvedValue()

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Não foi possível carregar suas listas agora.')
  })

  it('navega para a lista quando o usuário toca em uma lista', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockImplementation(async () => {
      listsStore.items = [
        {
          id: 'lista-1',
          name: 'Quero ler',
          created_at: '2026-01-01T10:00:00.000Z',
          updated_at: '2026-01-01T10:00:00.000Z',
        },
      ]
    })
    await router.push('/app')

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="list-link-lista-1"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('list-detail')
    expect(router.currentRoute.value.params.listId).toBe('lista-1')
  })

  it('envia o nome para criar uma nova lista', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()

    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockResolvedValue()
    const createListSpy = vi.spyOn(listsStore, 'createList').mockResolvedValue({
      id: 'lista-2',
      name: 'Lendo agora',
      created_at: '2026-01-01T11:00:00.000Z',
      updated_at: '2026-01-01T11:00:00.000Z',
    })

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    await wrapper.get('input[name="list-name"]').setValue('Lendo agora')
    await wrapper.get('form').trigger('submit.prevent')

    expect(createListSpy).toHaveBeenCalledWith('Lendo agora')
    expect(useToastStore().current?.message).toBe('Lista criada.')
  })

  it('usa somente toast para avisar falhas ao criar lista', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()

    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockResolvedValue()
    vi.spyOn(listsStore, 'createList').mockImplementation(async () => {
      listsStore.errorMessage = 'Você já tem uma lista com esse nome.'
      throw new Error('falha')
    })

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('input[name="list-name"]').setValue('Quero ler')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Você já tem uma lista com esse nome.')
    expect(wrapper.find('.app-feedback--error').exists()).toBe(false)
  })

  it('abre as opções de edição da lista sem abrir a lista', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockImplementation(async () => {
      listsStore.items = [
        {
          id: 'lista-1',
          name: 'Quero ler',
          created_at: '2026-01-01T10:00:00.000Z',
          updated_at: '2026-01-01T10:00:00.000Z',
        },
      ]
    })
    await router.push('/app')

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="open-list-options-lista-1"]').trigger('click')

    expect(router.currentRoute.value.name).toBe('app-home')
    expect(wrapper.get('[data-testid="list-options-sheet"]').text()).toContain('Editar lista')
    expect(wrapper.get('[data-testid="list-options-sheet"]').text()).toContain('Editar nome')
    expect(wrapper.get('[data-testid="list-options-sheet"]').text()).toContain('Apagar lista')
  })

  it('renomeia uma lista pelo menu de edição', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockImplementation(async () => {
      listsStore.items = [
        {
          id: 'lista-1',
          name: 'Quero ler',
          created_at: '2026-01-01T10:00:00.000Z',
          updated_at: '2026-01-01T10:00:00.000Z',
        },
      ]
    })
    const updateListNameSpy = vi.spyOn(listsStore, 'updateListName').mockResolvedValue({
      id: 'lista-1',
      name: 'Lidos este ano',
      created_at: '2026-01-01T10:00:00.000Z',
      updated_at: '2026-01-02T10:00:00.000Z',
    })

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="open-list-options-lista-1"]').trigger('click')
    await wrapper.get('[data-testid="request-rename-list-lista-1"]').trigger('click')
    await wrapper.get('input[name="edit-list-name"]').setValue('Lidos este ano')
    await wrapper.get('[data-testid="edit-list-form"]').trigger('submit.prevent')

    expect(updateListNameSpy).toHaveBeenCalledWith('lista-1', 'Lidos este ano')
    expect(useToastStore().current?.message).toBe('Lista atualizada.')
  })

  it('mostra confirmação clara antes de apagar a lista', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockImplementation(async () => {
      listsStore.items = [
        {
          id: 'lista-1',
          name: 'Quero ler',
          created_at: '2026-01-01T10:00:00.000Z',
          updated_at: '2026-01-01T10:00:00.000Z',
        },
      ]
    })
    const deleteListSpy = vi.spyOn(listsStore, 'deleteList').mockResolvedValue()

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="open-list-options-lista-1"]').trigger('click')
    await wrapper.get('[data-testid="request-delete-list-lista-1"]').trigger('click')

    expect(wrapper.get('[data-testid="delete-list-confirm-sheet"]').text()).toContain('Apagar lista?')
    expect(wrapper.get('[data-testid="delete-list-confirm-sheet"]').text()).toContain('Todos os livros serão removidos desta lista, mas continuarão cadastrados no Sophena.')

    await wrapper.get('[data-testid="confirm-sheet-confirm"]').trigger('click')

    expect(deleteListSpy).toHaveBeenCalledWith('lista-1')
    expect(useToastStore().current?.message).toBe('Lista apagada.')
  })

  it('mostra entrada da área administrativa para usuário admin', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockResolvedValue()

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.get('[data-testid="authenticated-dock"]').text()).toContain('Admin')
    expect(wrapper.text()).not.toContain('Criar usuário')
    expect(wrapper.text()).not.toContain('Ver registros')
    expect(wrapper.text()).not.toContain('Você também pode acessar atalhos administrativos pelo dock inferior.')
  })

  it('não mostra entrada da área administrativa para usuário comum', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockResolvedValue()

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.get('[data-testid="authenticated-dock"]').text()).not.toContain('Admin')
  })

  it('leva o admin para a tela administrativa ao tocar no atalho', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockResolvedValue()
    await router.push('/app')

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="dock-link-admin"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-home')
  })

  it('faz logout pela API antes de redirecionar para o login', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = authenticateUser()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockResolvedValue()
    const logoutSpy = vi.spyOn(authStore, 'logout').mockImplementation(async () => {
      authStore.clearSession()
    })
    await router.push('/app')

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="dock-action-logout"]').trigger('click')
    await wrapper.get('[data-testid="confirm-sheet-confirm"]').trigger('click')
    await flushPromises()

    expect(logoutSpy).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('mostra erro amigável e não redireciona quando o logout falha', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = authenticateUser()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockResolvedValue()
    vi.spyOn(authStore, 'logout').mockImplementation(async () => {
      authStore.errorMessage = 'Não foi possível sair agora. Tente novamente em instantes.'
      throw new Error('falha')
    })
    await router.push('/app')

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="dock-action-logout"]').trigger('click')
    await wrapper.get('[data-testid="confirm-sheet-confirm"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('app-home')
    expect(wrapper.text()).toContain('Não foi possível sair agora. Tente novamente em instantes.')
  })
})
