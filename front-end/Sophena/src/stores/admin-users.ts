import { ref } from 'vue'
import { defineStore } from 'pinia'

import { createAdminUserRequest, type AdminCreatedUser } from '@/lib/api/admin'
import { ApiError } from '@/lib/api/http'
import { useAuthStore } from './auth'

function hasLocalValidationError(input: { user_name: string; password: string }) {
  return input.user_name.trim().length === 0 || input.password.trim().length < 8
}

function mapAdminUserError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'Você não tem permissão para criar usuários.'
    }

    if (error.status === 409) {
      return 'Já existe um usuário com esse nome.'
    }

    if (error.status === 400) {
      return 'Confira os dados preenchidos e tente novamente.'
    }
  }

  return 'Não foi possível criar o usuário agora.'
}

export const useAdminUsersStore = defineStore('admin-users', () => {
  const authStore = useAuthStore()
  const isCreating = ref(false)
  const errorMessage = ref('')
  const feedbackMessage = ref('')

  async function createUser(input: {
    user_name: string
    password: string
    is_admin: boolean
  }) {
    const normalizedInput = {
      user_name: input.user_name.trim(),
      password: input.password,
      is_admin: input.is_admin,
    }

    errorMessage.value = ''
    feedbackMessage.value = ''

    if (hasLocalValidationError(normalizedInput)) {
      errorMessage.value = 'Preencha usuário e senha com pelo menos 8 caracteres.'
      throw new Error('invalid input')
    }

    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      throw new Error('missing access token')
    }

    isCreating.value = true

    try {
      const createdUser = await createAdminUserRequest(authStore.accessToken, normalizedInput)
      feedbackMessage.value = 'Usuário criado com sucesso.'
      return createdUser
    } catch (error) {
      errorMessage.value = mapAdminUserError(error)
      throw error
    } finally {
      isCreating.value = false
    }
  }

  return {
    isCreating,
    errorMessage,
    feedbackMessage,
    createUser,
  }
})

export type AdminUsersStoreCreatedUser = AdminCreatedUser
