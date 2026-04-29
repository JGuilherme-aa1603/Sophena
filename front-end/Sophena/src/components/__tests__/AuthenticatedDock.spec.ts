import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AuthenticatedDock from '../layout/AuthenticatedDock.vue'

describe('AuthenticatedDock', () => {
  it('mostra navegação contextual para usuário comum', async () => {
    const wrapper = mount(AuthenticatedDock, {
      props: {
        activeRoute: 'app-home',
        showAdmin: false,
      },
    })

    expect(wrapper.text()).toContain('Listas')
    expect(wrapper.text()).toContain('Sair')
    expect(wrapper.text()).not.toContain('Admin')
    expect(wrapper.get('[data-testid="dock-link-lists"]').attributes('aria-current')).toBe('page')
    expect(wrapper.find('[data-testid="dock-icon-lists"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="dock-icon-logout"]').exists()).toBe(true)

    await wrapper.get('[data-testid="dock-action-logout"]').trigger('click')

    expect(wrapper.emitted('logout')).toHaveLength(1)
  })

  it('mostra atalho admin para administradores', async () => {
    const wrapper = mount(AuthenticatedDock, {
      props: {
        activeRoute: 'admin-home',
        showAdmin: true,
      },
    })

    expect(wrapper.get('[data-testid="dock-link-admin"]').attributes('aria-current')).toBe('page')
    expect(wrapper.find('[data-testid="dock-icon-admin"]').exists()).toBe(true)

    await wrapper.get('[data-testid="dock-link-lists"]').trigger('click')
    await wrapper.get('[data-testid="dock-link-admin"]').trigger('click')

    expect(wrapper.emitted('navigate')).toEqual([
      ['app-home'],
      ['admin-home'],
    ])
  })
})
