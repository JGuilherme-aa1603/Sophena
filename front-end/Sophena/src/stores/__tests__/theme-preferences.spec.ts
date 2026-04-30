import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useThemePreferencesStore } from '../theme-preferences'

const THEME_STORAGE_KEY = 'sophena:theme-preferences'

describe('theme preferences store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-appearance')
    vi.restoreAllMocks()
  })

  it('aplica o tema verde como padrão quando não há preferência salva', () => {
    const themeStore = useThemePreferencesStore()

    themeStore.restoreThemePreferences()

    expect(themeStore.accentColor).toBe('green')
    expect(themeStore.appearance).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('green')
    expect(document.documentElement.dataset.appearance).toBe('light')
  })

  it('troca para o tema roxo sem alterar a aparência escolhida', () => {
    const themeStore = useThemePreferencesStore()
    themeStore.restoreThemePreferences()
    themeStore.setAppearance('dark')

    themeStore.setAccentColor('purple')

    expect(themeStore.accentColor).toBe('purple')
    expect(themeStore.appearance).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('purple')
    expect(document.documentElement.dataset.appearance).toBe('dark')
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')).toEqual({
      accentColor: 'purple',
      appearance: 'dark',
    })
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(sessionStorage.getItem('access_token')).toBeNull()
  })

  it('troca de claro para escuro e salva a preferência no localStorage', () => {
    const themeStore = useThemePreferencesStore()
    themeStore.restoreThemePreferences()

    themeStore.setAppearance('dark')

    expect(themeStore.accentColor).toBe('green')
    expect(themeStore.appearance).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('green')
    expect(document.documentElement.dataset.appearance).toBe('dark')
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')).toEqual({
      accentColor: 'green',
      appearance: 'dark',
    })
  })

  it('troca de escuro para claro e mantém a cor de destaque atual', () => {
    const themeStore = useThemePreferencesStore()
    themeStore.restoreThemePreferences()

    themeStore.setAccentColor('purple')
    themeStore.setAppearance('dark')
    themeStore.setAppearance('light')

    expect(themeStore.accentColor).toBe('purple')
    expect(themeStore.appearance).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('purple')
    expect(document.documentElement.dataset.appearance).toBe('light')
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')).toEqual({
      accentColor: 'purple',
      appearance: 'light',
    })
  })

  it('restaura o tema roxo e a aparência escura salvos ao iniciar novamente', () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
      accentColor: 'purple',
      appearance: 'dark',
    }))

    const themeStore = useThemePreferencesStore()
    themeStore.restoreThemePreferences()

    expect(themeStore.accentColor).toBe('purple')
    expect(themeStore.appearance).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('purple')
    expect(document.documentElement.dataset.appearance).toBe('dark')
  })

  it('volta para o tema verde quando a preferência salva é inválida', () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
      accentColor: 'blue',
      appearance: 'dark',
    }))

    const themeStore = useThemePreferencesStore()
    themeStore.restoreThemePreferences()

    expect(themeStore.accentColor).toBe('green')
    expect(themeStore.appearance).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('green')
    expect(document.documentElement.dataset.appearance).toBe('light')
  })

  it('volta para a aparência clara quando a aparência salva é inválida', () => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
      accentColor: 'purple',
      appearance: 'auto',
    }))

    const themeStore = useThemePreferencesStore()
    themeStore.restoreThemePreferences()

    expect(themeStore.accentColor).toBe('green')
    expect(themeStore.appearance).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('green')
    expect(document.documentElement.dataset.appearance).toBe('light')
  })
})
