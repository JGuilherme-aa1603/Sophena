import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from '@ionic/vue-router'

import AdminHomeView from '../AdminHomeView.vue'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth'

describe('AdminHomeView', () => {
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

  it('mostra os atalhos administrativos em português', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()

    await router.push('/app/admin')

    const wrapper = mount(AdminHomeView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()

    expect(wrapper.text()).toContain('Área administrativa')
    expect(wrapper.text()).toContain('Criar usuário')
    expect(wrapper.text()).toContain('Ver registros')
    expect(wrapper.text()).toContain('Escolha a tarefa que deseja fazer.')
  })

  it('leva para a criação de usuários', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()

    await router.push('/app/admin')

    const wrapper = mount(AdminHomeView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="open-admin-users"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-users')
  })

  it('leva para os registros do sistema', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()

    await router.push('/app/admin')

    const wrapper = mount(AdminHomeView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="open-admin-logs"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-logs')
  })

  it('volta para a área principal', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()

    await router.push('/app/admin')

    const wrapper = mount(AdminHomeView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="back-to-app"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('app-home')
  })
})
