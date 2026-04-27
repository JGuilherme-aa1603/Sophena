import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { AuthenticatedUser } from '@/lib/api/auth'
import { loginRequest, logoutRequest, meRequest, refreshRequest } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/http'

function extractFieldNames(body: unknown) {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('errors' in body) ||
    !Array.isArray(body.errors)
  ) {
    return []
  }

  return body.errors
    .map((error) =>
      typeof error === 'object' && error !== null && 'field' in error ? String(error.field) : null,
    )
    .filter((field): field is string => Boolean(field))
}

function mapAuthError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Usuário ou senha não conferem.'
    }

    if (error.status === 400) {
      const fields = extractFieldNames(error.body)

      if (fields.includes('user_name') && fields.includes('password')) {
        return 'Preencha usuário e senha para continuar.'
      }

      if (fields.includes('user_name')) {
        return 'Preencha seu usuário para continuar.'
      }

      if (fields.includes('password')) {
        return 'Preencha sua senha para continuar.'
      }
    }
  }

  return 'Não foi possível entrar agora. Tente novamente em instantes.'
}

function mapLogoutError() {
  return 'Não foi possível sair agora. Tente novamente em instantes.'
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<AuthenticatedUser | null>(null)
  const errorMessage = ref('')
  const isLoading = ref(false)
  const hasResolvedSession = ref(false)

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value))

  function setAccessToken(token: string | null) {
    accessToken.value = token
  }

  function clearSession() {
    accessToken.value = null
    user.value = null
    hasResolvedSession.value = true
  }

  async function login(input: { user_name: string; password: string }) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await loginRequest(input)
      accessToken.value = response.access_token
      user.value = response.user
      hasResolvedSession.value = true
    } catch (error) {
      clearSession()
      errorMessage.value = mapAuthError(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCurrentUser() {
    if (!accessToken.value) {
      clearSession()
      return null
    }

    isLoading.value = true

    try {
      const currentUser = await meRequest(accessToken.value)
      user.value = currentUser
      errorMessage.value = ''
      hasResolvedSession.value = true
      return currentUser
    } catch (error) {
      clearSession()

      if (error instanceof ApiError && error.status === 401) {
        errorMessage.value = 'Sua sessão expirou. Entre novamente.'
        return null
      }

      errorMessage.value = 'Não foi possível confirmar sua sessão agora.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function restoreSessionFromRefreshCookie() {
    isLoading.value = true

    try {
      const response = await refreshRequest()
      accessToken.value = response.access_token
      const currentUser = await meRequest(response.access_token)
      user.value = currentUser
      errorMessage.value = ''
      hasResolvedSession.value = true
      return true
    } catch {
      accessToken.value = null
      user.value = null
      hasResolvedSession.value = true
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function ensureSession() {
    if (!accessToken.value) {
      if (hasResolvedSession.value) {
        return false
      }

      return restoreSessionFromRefreshCookie()
    }

    if (user.value) {
      hasResolvedSession.value = true
      return true
    }

    if (hasResolvedSession.value) {
      return false
    }

    const currentUser = await fetchCurrentUser()
    return Boolean(currentUser)
  }

  async function logout() {
    if (!accessToken.value) {
      clearSession()
      errorMessage.value = ''
      return
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      await logoutRequest(accessToken.value)
      clearSession()
      errorMessage.value = ''
    } catch (error) {
      errorMessage.value = mapLogoutError()
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    accessToken,
    user,
    errorMessage,
    isLoading,
    isAuthenticated,
    clearSession,
    ensureSession,
    fetchCurrentUser,
    login,
    logout,
    restoreSessionFromRefreshCookie,
    setAccessToken,
  }
})
