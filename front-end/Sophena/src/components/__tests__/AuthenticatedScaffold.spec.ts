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
      user_picture_url: null,
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

  it('abre a tela de perfil pelo dock', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticate()

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
    await wrapper.get('[data-testid="dock-action-profile"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('profile')
  })

  it('expõe uma folga inferior extra quando a viewport visual do mobile fica reduzida', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 844,
    })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height: 760,
        offsetTop: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })

    const router = createAppRouter(createMemoryHistory())
    authenticate()

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

    expect(wrapper.find('ion-content').attributes('style')).toContain('--viewport-bottom-offset: 84px;')
  })
})
