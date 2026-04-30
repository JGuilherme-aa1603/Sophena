import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from '@ionic/vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProfileView from '../ProfileView.vue'
import { createAppRouter } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useThemePreferencesStore } from '@/stores/theme-preferences'
import { useToastStore } from '@/stores/toast'

describe('ProfileView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-appearance')
    vi.restoreAllMocks()
  })

  function authenticate(input: {
    is_admin?: boolean
    user_picture_url?: string | null
  } = {}) {
    const authStore = useAuthStore()
    authStore.setAccessToken('token-valido')
    authStore.user = {
      id: 'user-1',
      user_name: input.is_admin ? 'admin' : 'leitora',
      user_picture_url: input.user_picture_url ?? null,
      is_admin: input.is_admin ?? false,
    }

    return authStore
  }

  async function mountProfile() {
    const router = createAppRouter(createMemoryHistory())
    await router.push('/app/profile')
    const wrapper = mount(ProfileView, {
      global: {
        plugins: [router],
      },
    })

    await router.isReady()
    return { router, wrapper }
  }

  it('mostra as informações úteis do usuário sem expor o ID técnico', async () => {
    authenticate({
      user_picture_url: 'https://cdn.sophena.test/user-pictures/leitora.webp',
    })

    const { wrapper } = await mountProfile()

    expect(wrapper.get('[data-testid="profile-user-name"]').text()).toContain('leitora')
    expect(wrapper.get('[data-testid="profile-account-type"]').text()).toContain('Usuário')
    expect(wrapper.get('[data-testid="profile-picture-image"]').attributes('src')).toBe('https://cdn.sophena.test/user-pictures/leitora.webp')
    expect(wrapper.text()).not.toContain('user-1')
  })

  it('mostra o tipo de conta administrativa', async () => {
    authenticate({
      is_admin: true,
    })

    const { wrapper } = await mountProfile()

    expect(wrapper.get('[data-testid="profile-user-name"]').text()).toContain('admin')
    expect(wrapper.get('[data-testid="profile-account-type"]').text()).toContain('Administrador')
  })

  it('abre opções de foto ao tocar na opção de foto de perfil', async () => {
    authenticate()

    const { wrapper } = await mountProfile()

    await wrapper.get('[data-testid="profile-picture-option"]').trigger('click')

    expect(wrapper.get('[data-testid="profile-picture-options-sheet"]').text()).toContain('Alterar foto')
    expect(wrapper.get('[data-testid="profile-picture-options-sheet"]').text()).toContain('Remover foto')
  })

  it('mostra a opção Temas acima de Sair e abre o painel de temas', async () => {
    authenticate()

    const { wrapper } = await mountProfile()
    const themeOption = wrapper.get('[data-testid="profile-action-themes"]')
    const logoutOption = wrapper.get('[data-testid="profile-action-logout"]')

    expect(themeOption.text()).toContain('Temas')
    expect(themeOption.element.compareDocumentPosition(logoutOption.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    await themeOption.trigger('click')

    const themeSheet = wrapper.get('[data-testid="profile-theme-options-sheet"]')
    expect(themeSheet.attributes('aria-modal')).toBe('true')
    expect(themeSheet.text()).toContain('Cor do tema')
    expect(themeSheet.text()).toContain('Clássico')
    expect(themeSheet.text()).toContain('Moderno')
    expect(themeSheet.text()).toContain('Aparência')
    expect(themeSheet.text()).toContain('Claro')
    expect(themeSheet.text()).toContain('Escuro')
  })

  it('troca para o tema moderno sem limpar a sessão atual', async () => {
    const authStore = authenticate()
    const themeStore = useThemePreferencesStore()
    const clearSessionSpy = vi.spyOn(authStore, 'clearSession')
    const logoutSpy = vi.spyOn(authStore, 'logout')

    const { wrapper } = await mountProfile()

    await wrapper.get('[data-testid="profile-action-themes"]').trigger('click')
    await wrapper.get('[data-testid="profile-theme-purple"]').trigger('click')

    expect(themeStore.accentColor).toBe('purple')
    expect(document.documentElement.dataset.theme).toBe('purple')
    expect(authStore.accessToken).toBe('token-valido')
    expect(authStore.user?.user_name).toBe('leitora')
    expect(clearSessionSpy).not.toHaveBeenCalled()
    expect(logoutSpy).not.toHaveBeenCalled()
  })

  it('troca a aparência entre escuro e claro mantendo a cor de destaque e a sessão atual', async () => {
    const authStore = authenticate()
    const themeStore = useThemePreferencesStore()
    const clearSessionSpy = vi.spyOn(authStore, 'clearSession')
    const logoutSpy = vi.spyOn(authStore, 'logout')

    const { router, wrapper } = await mountProfile()

    await wrapper.get('[data-testid="profile-action-themes"]').trigger('click')
    await wrapper.get('[data-testid="profile-theme-purple"]').trigger('click')
    await wrapper.get('[data-testid="profile-appearance-dark"]').trigger('click')

    expect(themeStore.accentColor).toBe('purple')
    expect(themeStore.appearance).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('purple')
    expect(document.documentElement.dataset.appearance).toBe('dark')
    expect(authStore.accessToken).toBe('token-valido')
    expect(authStore.user?.user_name).toBe('leitora')
    expect(router.currentRoute.value.name).toBe('profile')
    expect(clearSessionSpy).not.toHaveBeenCalled()
    expect(logoutSpy).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="profile-appearance-light"]').trigger('click')

    expect(themeStore.accentColor).toBe('purple')
    expect(themeStore.appearance).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('purple')
    expect(document.documentElement.dataset.appearance).toBe('light')
    expect(authStore.accessToken).toBe('token-valido')
    expect(authStore.user?.user_name).toBe('leitora')
    expect(router.currentRoute.value.name).toBe('profile')
    expect(clearSessionSpy).not.toHaveBeenCalled()
    expect(logoutSpy).not.toHaveBeenCalled()
  })

  it('amplia a foto de perfil ao tocar na foto cadastrada', async () => {
    authenticate({
      user_picture_url: 'https://cdn.sophena.test/user-pictures/leitora.webp',
    })

    const { wrapper } = await mountProfile()

    await wrapper.get('[data-testid="profile-picture-zoom-trigger"]').trigger('click')

    const zoomImage = wrapper.get('[data-testid="profile-picture-zoom-image"]')
    expect(wrapper.get('[data-testid="profile-picture-zoom-overlay"]').attributes('aria-modal')).toBe('true')
    expect(zoomImage.attributes('src')).toBe('https://cdn.sophena.test/user-pictures/leitora.webp')
    expect(zoomImage.attributes('alt')).toBe('Foto de perfil de leitora')
  })

  it('fecha a foto ampliada ao tocar fora da foto', async () => {
    authenticate({
      user_picture_url: 'https://cdn.sophena.test/user-pictures/leitora.webp',
    })

    const { wrapper } = await mountProfile()

    await wrapper.get('[data-testid="profile-picture-zoom-trigger"]').trigger('click')
    await wrapper.get('[data-testid="profile-picture-zoom-overlay"]').trigger('click')

    expect(wrapper.find('[data-testid="profile-picture-zoom-overlay"]').exists()).toBe(false)
  })

  it('mantém a foto ampliada aberta ao tocar na imagem', async () => {
    authenticate({
      user_picture_url: 'https://cdn.sophena.test/user-pictures/leitora.webp',
    })

    const { wrapper } = await mountProfile()

    await wrapper.get('[data-testid="profile-picture-zoom-trigger"]').trigger('click')
    await wrapper.get('[data-testid="profile-picture-zoom-image"]').trigger('click')

    expect(wrapper.find('[data-testid="profile-picture-zoom-overlay"]').exists()).toBe(true)
  })

  it('não exibe controle de zoom quando o usuário não tem foto', async () => {
    authenticate()

    const { wrapper } = await mountProfile()

    expect(wrapper.get('[data-testid="profile-picture-fallback"]').text()).toBe('L')
    expect(wrapper.find('[data-testid="profile-picture-zoom-trigger"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="profile-picture-zoom-overlay"]').exists()).toBe(false)
  })

  it('altera a foto depois de abrir as opções de foto', async () => {
    const authStore = authenticate()
    const toastStore = useToastStore()
    const updatePictureSpy = vi.spyOn(authStore, 'updateUserPicture').mockImplementation(async () => {
      const updatedUser = {
        id: 'user-1',
        user_name: 'leitora',
        user_picture_url: 'https://cdn.sophena.test/user-pictures/nova.webp',
        is_admin: false,
      }
      authStore.user = updatedUser
      return updatedUser
    })

    const { wrapper } = await mountProfile()
    await wrapper.get('[data-testid="profile-picture-option"]').trigger('click')

    const pictureFile = new File(['foto'], 'foto.png', { type: 'image/png' })
    const input = wrapper.get('input[name="profile-picture-file"]')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [pictureFile],
    })

    await input.trigger('change')
    await flushPromises()

    expect(updatePictureSpy).toHaveBeenCalledWith(pictureFile)
    expect(toastStore.current?.message).toBe('Foto atualizada com sucesso.')
  })

  it('pede confirmação antes de remover a foto', async () => {
    const authStore = authenticate({
      user_picture_url: 'https://cdn.sophena.test/user-pictures/atual.webp',
    })
    const removePictureSpy = vi.spyOn(authStore, 'removeUserPicture').mockImplementation(async () => {
      const updatedUser = {
        id: 'user-1',
        user_name: 'leitora',
        user_picture_url: null,
        is_admin: false,
      }
      authStore.user = updatedUser
      return updatedUser
    })

    const { wrapper } = await mountProfile()
    await wrapper.get('[data-testid="profile-picture-option"]').trigger('click')
    await wrapper.get('[data-testid="profile-action-remove-picture"]').trigger('click')

    expect(wrapper.get('[data-testid="remove-picture-confirm-sheet"]').text()).toContain('Remover foto?')
    expect(removePictureSpy).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="confirm-sheet-confirm"]').trigger('click')
    await flushPromises()

    expect(removePictureSpy).toHaveBeenCalledTimes(1)
  })

  it('pede confirmação antes de sair e redireciona para o login', async () => {
    const authStore = authenticate()
    const logoutSpy = vi.spyOn(authStore, 'logout').mockImplementation(async () => {
      authStore.clearSession()
    })

    const { router, wrapper } = await mountProfile()

    await wrapper.get('[data-testid="profile-action-logout"]').trigger('click')
    expect(wrapper.get('[data-testid="logout-confirm-sheet"]').text()).toContain('Sair da sessão?')
    expect(logoutSpy).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="confirm-sheet-confirm"]').trigger('click')
    await flushPromises()

    expect(logoutSpy).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.name).toBe('login')
  })
})
