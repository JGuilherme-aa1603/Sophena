import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'

import LoginView from '../LoginView.vue'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth'

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('envia usuário e senha e redireciona para a área principal', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    const loginSpy = vi.spyOn(authStore, 'login').mockImplementation(async () => {
      authStore.setAccessToken('token-valido')
      authStore.user = {
        id: 'user-1',
        user_name: 'leitora',
        is_admin: false,
      }
    })
    await router.push('/login')

    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })
    await router.isReady()

    await wrapper.get('input[name="user_name"]').setValue('leitora')
    await wrapper.get('input[name="password"]').setValue('SenhaSegura#123')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(loginSpy).toHaveBeenCalledWith({
      user_name: 'leitora',
      password: 'SenhaSegura#123',
    })
    expect(router.currentRoute.value.name).toBe('app-home')
  })

  it('mostra mensagem clara quando o login falha', async () => {
    const router = createAppRouter(createMemoryHistory())
    const authStore = useAuthStore()
    authStore.errorMessage = 'Usuário ou senha não conferem.'
    vi.spyOn(authStore, 'login').mockRejectedValue(new Error('falha'))

    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })

    await wrapper.get('input[name="user_name"]').setValue('leitora')
    await wrapper.get('input[name="password"]').setValue('SenhaErrada#123')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Usuário ou senha não conferem.')
  })

  it('mantém textos da interface em português', () => {
    const router = createAppRouter(createMemoryHistory())

    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Entrar')
    expect(wrapper.text()).toContain('Usuário')
    expect(wrapper.text()).toContain('Senha')
    expect(wrapper.text()).toContain('Entre com seus dados para continuar.')
  })
})
