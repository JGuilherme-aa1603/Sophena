import { ref } from 'vue'
import { defineStore } from 'pinia'

import {
  createListRequest,
  deleteListRequest,
  fetchListsRequest,
  updateListRequest,
  type UserList,
} from '@/lib/api/lists'
import { ApiError } from '@/lib/api/http'
import { useAuthStore } from './auth'

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

function mapFetchListsError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Sua sessão expirou. Entre novamente.'
  }

  return 'Não foi possível carregar suas listas agora.'
}

function mapCreateListError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'Você já tem uma lista com esse nome.'
    }

    if (error.status === 400) {
      const fields = extractFieldNames(error.body)

      if (fields.includes('name')) {
        return 'Digite um nome para criar a lista.'
      }
    }
  }

  return 'Não foi possível criar a lista agora.'
}

function mapUpdateListError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'Você já tem uma lista com esse nome.'
    }

    if (error.status === 400) {
      const fields = extractFieldNames(error.body)

      if (fields.includes('name')) {
        return 'Digite um nome para a lista.'
      }
    }
  }

  return 'Não foi possível atualizar a lista agora.'
}

function mapDeleteListError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Sua sessão expirou. Entre novamente.'
  }

  return 'Não foi possível apagar a lista agora.'
}

export const useListsStore = defineStore('lists', () => {
  const authStore = useAuthStore()
  const items = ref<UserList[]>([])
  const isLoading = ref(false)
  const isCreating = ref(false)
  const isUpdating = ref(false)
  const isDeleting = ref(false)
  const errorMessage = ref('')

  async function fetchLists() {
    if (!authStore.accessToken) {
      items.value = []
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      return
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await fetchListsRequest(authStore.accessToken)
      items.value = response.items
    } catch (error) {
      items.value = []
      errorMessage.value = mapFetchListsError(error)
    } finally {
      isLoading.value = false
    }
  }

  async function createList(name: string) {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      throw new Error('missing access token')
    }

    isCreating.value = true
    errorMessage.value = ''

    try {
      const createdList = await createListRequest(authStore.accessToken, {
        name,
      })

      items.value = [createdList, ...items.value]
      return createdList
    } catch (error) {
      errorMessage.value = mapCreateListError(error)
      throw error
    } finally {
      isCreating.value = false
    }
  }

  async function updateListName(listId: string, name: string) {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      throw new Error('missing access token')
    }

    isUpdating.value = true
    errorMessage.value = ''

    try {
      const updatedList = await updateListRequest(authStore.accessToken, listId, {
        name,
      })

      items.value = items.value.map((list) => list.id === updatedList.id ? updatedList : list)
      return updatedList
    } catch (error) {
      errorMessage.value = mapUpdateListError(error)
      throw error
    } finally {
      isUpdating.value = false
    }
  }

  async function deleteList(listId: string) {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      throw new Error('missing access token')
    }

    isDeleting.value = true
    errorMessage.value = ''

    try {
      await deleteListRequest(authStore.accessToken, listId)
      items.value = items.value.filter((list) => list.id !== listId)
    } catch (error) {
      errorMessage.value = mapDeleteListError(error)
      throw error
    } finally {
      isDeleting.value = false
    }
  }

  return {
    items,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    errorMessage,
    createList,
    updateListName,
    deleteList,
    fetchLists,
  }
})
