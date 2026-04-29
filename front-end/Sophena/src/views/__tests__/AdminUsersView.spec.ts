import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from '@ionic/vue-router'

import AdminUsersView from '../AdminUsersView.vue'
import { createAppRouter } from '@/router'
import { useAdminUsersStore } from '@/stores/admin-users'
import { useAuthStore } from '@/stores/auth'

describe('AdminUsersView', () => {
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

  it('permite criar um usuário normal', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminUsersStore()
    const createUserSpy = vi.spyOn(store, 'createUser').mockResolvedValue({
      id: 'user-1',
      user_name: 'nova-leitora',
      is_admin: false,
      created_at: '2026-01-01T12:00:00.000Z',
    })

    await router.push('/app/admin/users')

    const wrapper = mount(AdminUsersView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('input[name="admin-user-name"]').setValue('nova-leitora')
    await wrapper.get('input[name="admin-password"]').setValue('SenhaNova#123')
    await wrapper.get('form').trigger('submit.prevent')

    expect(createUserSpy).toHaveBeenCalledWith({
      user_name: 'nova-leitora',
      password: 'SenhaNova#123',
      is_admin: false,
    })
  })

  it('permite marcar que o novo usuário será administrador', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminUsersStore()
    const createUserSpy = vi.spyOn(store, 'createUser').mockResolvedValue({
      id: 'user-2',
      user_name: 'nova-admin',
      is_admin: true,
      created_at: '2026-01-01T13:00:00.000Z',
    })

    await router.push('/app/admin/users')

    const wrapper = mount(AdminUsersView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('input[name="admin-user-name"]').setValue('nova-admin')
    await wrapper.get('input[name="admin-password"]').setValue('SenhaNova#123')
    expect(wrapper.find('input[name="admin-is-admin"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="admin-permission-reader"]').attributes('aria-pressed')).toBe('true')

    await wrapper.get('[data-testid="admin-permission-admin"]').trigger('click')
    expect(wrapper.get('[data-testid="admin-permission-admin"]').attributes('aria-pressed')).toBe('true')
    await wrapper.get('form').trigger('submit.prevent')

    expect(createUserSpy).toHaveBeenCalledWith({
      user_name: 'nova-admin',
      password: 'SenhaNova#123',
      is_admin: true,
    })
  })

  it('mostra mensagem em português quando a validação local falha', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminUsersStore()
    store.errorMessage = 'Preencha usuário e senha com pelo menos 8 caracteres.'

    await router.push('/app/admin/users')

    const wrapper = mount(AdminUsersView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    expect(wrapper.text()).not.toContain('Preencha usuário e senha com pelo menos 8 caracteres.')
  })

  it('usa somente toast para avisar falhas ao criar usuário', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminUsersStore()
    vi.spyOn(store, 'createUser').mockImplementation(async () => {
      store.errorMessage = 'Já existe um usuário com esse nome.'
      throw new Error('falha')
    })

    await router.push('/app/admin/users')

    const wrapper = mount(AdminUsersView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('input[name="admin-user-name"]').setValue('usuario-existente')
    await wrapper.get('input[name="admin-password"]').setValue('SenhaNova#123')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Já existe um usuário com esse nome.')
    expect(wrapper.find('.app-feedback--error').exists()).toBe(false)
  })

  it('volta para a área administrativa', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()

    await router.push('/app/admin/users')

    const wrapper = mount(AdminUsersView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('[data-testid="back-to-app"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('admin-home')
  })
})
