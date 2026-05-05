import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { IonicVue } from '@ionic/vue'
import { createMemoryHistory } from '@ionic/vue-router'
import { nextTick } from 'vue'

import App from '../App.vue'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth'

describe('App auth rendering', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('renderiza a tela de login sem quebrar o IonRouterOutlet', async () => {
    const pinia = createPinia()
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore(pinia)

    vi.spyOn(authStore, 'ensureSession').mockResolvedValue(false)

    await router.push('/login?redirect=/app')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [IonicVue, pinia, router],
      },
    })

    await nextTick()

    expect(wrapper.text()).toContain('Volte para')
    expect(wrapper.text()).toContain('Suas listas estão te esperando.')
  })
})
