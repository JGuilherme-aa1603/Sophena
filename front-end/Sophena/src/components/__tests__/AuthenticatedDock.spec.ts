import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

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
    expect(wrapper.text()).toContain('Livros')
    expect(wrapper.text()).toContain('Sair')
    expect(wrapper.text()).not.toContain('Admin')
    expect(wrapper.get('[data-testid="dock-link-lists"]').attributes('aria-current')).toBe('page')
    expect(wrapper.find('[data-testid="dock-icon-books"]').exists()).toBe(true)
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
    await wrapper.get('[data-testid="dock-link-books"]').trigger('click')
    await wrapper.get('[data-testid="dock-link-admin"]').trigger('click')

    expect(wrapper.emitted('navigate')).toEqual([
      ['app-home'],
      ['books'],
      ['admin-home'],
    ])
  })

  it('destaca a tela de livros quando ela está ativa', () => {
    const wrapper = mount(AuthenticatedDock, {
      props: {
        activeRoute: 'books',
        showAdmin: false,
      },
    })

    expect(wrapper.get('[data-testid="dock-link-books"]').attributes('aria-current')).toBe('page')
    expect(wrapper.get('[data-testid="dock-link-books"]').classes()).toContain('dock-link--active')
    expect(wrapper.get('[data-testid="dock-link-lists"]').classes()).not.toContain('dock-link--active')
  })

  it('remove o foco visual depois do clique por toque ou mouse', async () => {
    const wrapper = mount(AuthenticatedDock, {
      props: {
        activeRoute: 'app-home',
        showAdmin: true,
      },
    })

    const button = wrapper.get('[data-testid="dock-link-admin"]').element as HTMLButtonElement
    const blurSpy = vi.spyOn(button, 'blur')

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))

    expect(blurSpy).toHaveBeenCalledTimes(1)
  })

  it('mantém o foco quando a ação vem do teclado', async () => {
    const wrapper = mount(AuthenticatedDock, {
      props: {
        activeRoute: 'app-home',
        showAdmin: true,
      },
    })

    const button = wrapper.get('[data-testid="dock-link-admin"]').element as HTMLButtonElement
    const blurSpy = vi.spyOn(button, 'blur')

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))

    expect(blurSpy).not.toHaveBeenCalled()
  })

  it('mantém classes estáveis para o estilo base e o destaque da rota ativa', () => {
    const wrapper = mount(AuthenticatedDock, {
      props: {
        activeRoute: 'app-home',
        showAdmin: true,
      },
    })

    expect(wrapper.get('[data-testid="dock-link-lists"]').classes()).toContain('dock-link--active')
    expect(wrapper.get('[data-testid="dock-link-admin"]').classes()).not.toContain('dock-link--active')
    expect(wrapper.get('[data-testid="dock-action-logout"]').classes()).toContain('dock-link--danger')
  })
})
