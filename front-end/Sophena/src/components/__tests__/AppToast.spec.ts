import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AppToast from '../feedback/AppToast.vue'
import { useToastStore } from '@/stores/toast'

describe('AppToast', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mostra uma mensagem curta de sucesso acima do dock', async () => {
    const toastStore = useToastStore()
    toastStore.showSuccess('Lista criada.')

    const wrapper = mount(AppToast)

    expect(wrapper.get('[data-testid="app-toast"]').text()).toContain('Lista criada.')
    expect(wrapper.get('[data-testid="app-toast"]').classes()).toContain('app-toast--success')
    expect(wrapper.get('[data-testid="app-toast"]').attributes('role')).toBe('status')
  })

  it('mostra erro com alerta e permite fechar manualmente', async () => {
    const toastStore = useToastStore()
    toastStore.showError('Não foi possível salvar.')

    const wrapper = mount(AppToast)

    expect(wrapper.get('[data-testid="app-toast"]').attributes('role')).toBe('alert')
    await wrapper.get('[data-testid="close-app-toast"]').trigger('click')

    expect(toastStore.current).toBeNull()
    expect(wrapper.find('[data-testid="app-toast"]').exists()).toBe(false)
  })

  it('fecha automaticamente depois do tempo definido', async () => {
    const toastStore = useToastStore()
    toastStore.showWarning('Confira os dados.', 1200)

    mount(AppToast)
    expect(toastStore.current?.message).toBe('Confira os dados.')

    vi.advanceTimersByTime(1200)

    expect(toastStore.current).toBeNull()
  })
})
