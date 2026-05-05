import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const THEME_PREFERENCES_STORAGE_KEY = 'sophena:theme-preferences'

export type AccentColor = 'green' | 'purple' | 'terracotta' | 'navy' | 'plum' | 'ebony'
export type AppearanceMode = 'light' | 'dark'

type ThemePreferences = {
  accentColor: AccentColor
  appearance: AppearanceMode
}

const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  accentColor: 'green',
  appearance: 'light',
}

const VALID_ACCENT_COLORS: AccentColor[] = ['green', 'purple', 'terracotta', 'navy', 'plum', 'ebony']

function isAccentColor(value: unknown): value is AccentColor {
  return VALID_ACCENT_COLORS.includes(value as AccentColor)
}

function isAppearanceMode(value: unknown): value is AppearanceMode {
  return value === 'light' || value === 'dark'
}

function readSavedPreferences(): ThemePreferences {
  const savedValue = localStorage.getItem(THEME_PREFERENCES_STORAGE_KEY)

  if (!savedValue) {
    return DEFAULT_THEME_PREFERENCES
  }

  try {
    const parsedValue = JSON.parse(savedValue) as Partial<ThemePreferences>

    if (!isAccentColor(parsedValue.accentColor)) {
      return DEFAULT_THEME_PREFERENCES
    }

    if (!isAppearanceMode(parsedValue.appearance)) {
      return DEFAULT_THEME_PREFERENCES
    }

    return {
      accentColor: parsedValue.accentColor,
      appearance: parsedValue.appearance,
    }
  } catch {
    return DEFAULT_THEME_PREFERENCES
  }
}

function persistPreferences(preferences: ThemePreferences) {
  localStorage.setItem(THEME_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
}

function applyThemeToDocument(preferences: ThemePreferences) {
  document.documentElement.dataset.theme = preferences.accentColor
  document.documentElement.dataset.appearance = preferences.appearance
}

export const useThemePreferencesStore = defineStore('theme-preferences', () => {
  const accentColor = ref<AccentColor>(DEFAULT_THEME_PREFERENCES.accentColor)
  const appearance = ref<AppearanceMode>(DEFAULT_THEME_PREFERENCES.appearance)

  const preferences = computed<ThemePreferences>(() => ({
    accentColor: accentColor.value,
    appearance: appearance.value,
  }))

  function restoreThemePreferences() {
    const savedPreferences = readSavedPreferences()

    accentColor.value = savedPreferences.accentColor
    appearance.value = savedPreferences.appearance
    applyThemeToDocument(savedPreferences)
  }

  function setAccentColor(nextAccentColor: AccentColor) {
    accentColor.value = nextAccentColor
    applyThemeToDocument(preferences.value)
    persistPreferences(preferences.value)
  }

  function setAppearance(nextAppearance: AppearanceMode) {
    appearance.value = nextAppearance
    applyThemeToDocument(preferences.value)
    persistPreferences(preferences.value)
  }

  return {
    accentColor,
    appearance,
    preferences,
    restoreThemePreferences,
    setAccentColor,
    setAppearance,
  }
})
