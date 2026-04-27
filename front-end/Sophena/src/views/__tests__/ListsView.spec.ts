import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from '@ionic/vue-router'

import ListsView from '../ListsView.vue'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useListsStore } from '@/stores/lists'

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
  })

  it('mostra atalho de administração para usuário admin', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockResolvedValue()

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Criar usuário')
    expect(wrapper.text()).toContain('Ver registros')
  })

  it('não mostra atalho de administração para usuário comum', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateUser()
    const listsStore = useListsStore()
    vi.spyOn(listsStore, 'fetchLists').mockResolvedValue()

    const wrapper = mount(ListsView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).not.toContain('Criar usuário')
    expect(wrapper.text()).not.toContain('Ver registros')
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
    await wrapper.get('.exit-button').trigger('click')
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
    await wrapper.get('.exit-button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('app-home')
    expect(wrapper.text()).toContain('Não foi possível sair agora. Tente novamente em instantes.')
  })
})
