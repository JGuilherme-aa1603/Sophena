import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from '@ionic/vue-router'

import AdminLogsView from '../AdminLogsView.vue'
import { createAppRouter } from '@/router'
import { useAdminLogsStore } from '@/stores/admin-logs'
import { useAuthStore } from '@/stores/auth'

describe('AdminLogsView', () => {
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

  it('mostra resumo, filtros e lista de registros', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminLogsStore()
    vi.spyOn(store, 'fetchSummary').mockImplementation(async () => {
      store.summary = {
        success_count: 4,
        warn_count: 2,
        error_count: 1,
      }
    })
    vi.spyOn(store, 'fetchLogs').mockImplementation(async () => {
      store.logs = [
        {
          id: 'log-1',
          level: 'WARN',
          status_code: 401,
          message: 'Acesso negado',
          route: '/admin/users',
          method: 'POST',
          user_id: 'admin-1',
          created_at: '2026-04-20T12:00:00.000Z',
        },
      ]
      store.pagination.total = 1
    })

    await router.push('/app/admin/logs')

    const wrapper = mount(AdminLogsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    expect(wrapper.text()).toContain('Informação')
    expect(wrapper.text()).toContain('Aviso')
    expect(wrapper.text()).toContain('Erro')
    expect(wrapper.text()).toContain('Acesso negado')
    expect(wrapper.text()).not.toContain('2026-04-20T12:00:00.000Z')
  })

  it('aplica filtros e atualiza os registros', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminLogsStore()
    vi.spyOn(store, 'fetchSummary').mockResolvedValue()
    const fetchLogsSpy = vi.spyOn(store, 'fetchLogs').mockResolvedValue()

    await router.push('/app/admin/logs')

    const wrapper = mount(AdminLogsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    await wrapper.get('select[name="logs-level"]').setValue('WARN')
    await wrapper.get('select[name="logs-method"]').setValue('POST')
    await wrapper.get('input[name="logs-status-code"]').setValue('401')
    await wrapper.get('input[name="logs-from"]').setValue('2026-04-20T09:30')
    await wrapper.get('input[name="logs-to"]').setValue('2026-04-21T18:45')
    await wrapper.get('form[data-testid="logs-filters-form"]').trigger('submit.prevent')

    expect(store.filters.level).toBe('WARN')
    expect(store.filters.method).toBe('POST')
    expect(store.filters.status_code).toBe('401')
    expect(store.filters.from).toBe(new Date('2026-04-20T09:30').toISOString())
    expect(store.filters.to).toBe(new Date('2026-04-21T18:45').toISOString())
    expect(fetchLogsSpy).toHaveBeenCalled()
  })

  it('mostra estado vazio quando não há registros', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminLogsStore()
    vi.spyOn(store, 'fetchSummary').mockResolvedValue()
    vi.spyOn(store, 'fetchLogs').mockImplementation(async () => {
      store.logs = []
      store.pagination.total = 0
    })

    await router.push('/app/admin/logs')

    const wrapper = mount(AdminLogsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    expect(wrapper.text()).toContain('Nenhum registro foi encontrado.')
  })

  it('mostra erro em português quando não consegue carregar', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminLogsStore()
    store.errorMessage = 'Não foi possível carregar os registros agora.'
    vi.spyOn(store, 'fetchSummary').mockResolvedValue()
    vi.spyOn(store, 'fetchLogs').mockResolvedValue()

    await router.push('/app/admin/logs')

    const wrapper = mount(AdminLogsView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    expect(wrapper.text()).toContain('Não foi possível carregar os registros agora.')
  })

  it('volta para a área administrativa', async () => {
    const router = createAppRouter(createMemoryHistory())
    authenticateAdmin()
    const store = useAdminLogsStore()
    vi.spyOn(store, 'fetchSummary').mockResolvedValue()
    vi.spyOn(store, 'fetchLogs').mockResolvedValue()

    await router.push('/app/admin/logs')

    const wrapper = mount(AdminLogsView, {
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
