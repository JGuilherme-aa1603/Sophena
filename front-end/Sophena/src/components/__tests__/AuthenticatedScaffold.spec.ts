import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from '@ionic/vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AuthenticatedScaffold from '../layout/AuthenticatedScaffold.vue'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

describe('AuthenticatedScaffold', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  function authenticate() {
    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: 'leitora',
      is_admin: false,
    }

    return authStore
  }

  it('hospeda o toast global acima da navegação fixa', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticate()
    const toastStore = useToastStore()
    toastStore.showSuccess('Lista criada.')

    await router.push('/app')
    const wrapper = mount(AuthenticatedScaffold, {
      global: {
        plugins: [router],
      },
      slots: {
        default: '<p>Conteúdo</p>',
      },
    })

    await router.isReady()

    expect(wrapper.get('[data-testid="app-toast"]').text()).toContain('Lista criada.')
    expect(wrapper.find('[data-testid="authenticated-dock"]').exists()).toBe(true)
  })

  it('pede confirmação antes de encerrar a sessão pelo dock', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = authenticate()
    const logoutSpy = vi.spyOn(authStore, 'logout').mockImplementation(async () => {
      authStore.clearSession()
    })

    await router.push('/app')
    const wrapper = mount(AuthenticatedScaffold, {
      global: {
        plugins: [router],
      },
      slots: {
        default: '<p>Conteúdo</p>',
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="dock-action-logout"]').trigger('click')

    expect(wrapper.get('[data-testid="logout-confirm-sheet"]').text()).toContain('Sair da sessão?')
    expect(wrapper.get('[data-testid="logout-confirm-sheet"]').text()).toContain('Você precisará entrar novamente para usar o Sophena.')
    expect(logoutSpy).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="confirm-sheet-confirm"]').trigger('click')
    await flushPromises()

    expect(logoutSpy).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.name).toBe('login')
  })
})
