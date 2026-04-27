import { ref } from 'vue'
import { defineStore } from 'pinia'

import { searchBooksRequest, type BookSearchResult } from '@/lib/api/books'
import { ApiError } from '@/lib/api/http'
import {
  addExistingBookToListRequest,
  addManualBookToListRequest,
  deleteListItemRequest,
  fetchListItemsRequest,
  moveListItemRequest,
  reorderListItemRequest,
  type ListDetail,
  type ListItem,
} from '@/lib/api/list-items'
import { fetchListsRequest, type UserList } from '@/lib/api/lists'
import { useAuthStore } from './auth'

function mapFetchListDetailError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Sua sessão expirou. Entre novamente.'
  }

  return 'Não foi possível abrir essa lista agora.'
}

function mapRemoveItemError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Sua sessão expirou. Entre novamente.'
  }

  return 'Não foi possível remover o livro agora.'
}

function mapSearchBooksError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Sua sessão expirou. Entre novamente.'
  }

  return 'Não foi possível buscar os livros agora.'
}

function mapAddBookError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Sua sessão expirou. Entre novamente.'
    }

    if (error.status === 409) {
      return 'Esse livro já está nesta lista.'
    }

    if (error.status === 400) {
      return 'Confira os dados do livro e tente novamente.'
    }
  }

  return 'Não foi possível adicionar o livro agora.'
}

function mapReorderError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Sua sessão expirou. Entre novamente.'
  }

  if (error instanceof ApiError && error.status === 400) {
    return 'Não foi possível mudar a ordem desse livro.'
  }

  return 'Não foi possível atualizar a ordem agora.'
}

function mapMoveError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Sua sessão expirou. Entre novamente.'
    }

    if (error.status === 409) {
      return 'Esse livro já está na lista de destino.'
    }

    if (error.status === 400) {
      return 'Confira a lista escolhida e tente novamente.'
    }
  }

  return 'Não foi possível mover o livro agora.'
}

function sortItemsByPosition(items: ListItem[]) {
  return [...items].sort((left, right) => left.position - right.position)
}

function trimOptionalCoverUrl(coverUrl: string | undefined) {
  if (coverUrl === undefined) {
    return undefined
  }

  const trimmedCoverUrl = coverUrl.trim()
  return trimmedCoverUrl.length > 0 ? trimmedCoverUrl : undefined
}

export const useListDetailStore = defineStore('list-detail', () => {
  const authStore = useAuthStore()
  const list = ref<ListDetail | null>(null)
  const items = ref<ListItem[]>([])
  const availableLists = ref<UserList[]>([])
  const searchResults = ref<BookSearchResult[]>([])
  const isLoading = ref(false)
  const isSearching = ref(false)
  const isAddingBook = ref(false)
  const isLoadingLists = ref(false)
  const reorderingItemId = ref<string | null>(null)
  const movingItemId = ref<string | null>(null)
  const removingItemId = ref<string | null>(null)
  const errorMessage = ref('')
  const feedbackMessage = ref('')

  async function fetchListDetail(listId: string) {
    if (!authStore.accessToken || !listId) {
      list.value = null
      items.value = []
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      return
    }

    isLoading.value = true
    errorMessage.value = ''
    feedbackMessage.value = ''

    try {
      const response = await fetchListItemsRequest(authStore.accessToken, listId)
      list.value = response.list
      items.value = sortItemsByPosition(response.items)
    } catch (error) {
      list.value = null
      items.value = []
      errorMessage.value = mapFetchListDetailError(error)
    } finally {
      isLoading.value = false
    }
  }

  async function removeItem(listId: string, itemId: string) {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      throw new Error('missing access token')
    }

    removingItemId.value = itemId
    errorMessage.value = ''
    feedbackMessage.value = ''

    try {
      await deleteListItemRequest(authStore.accessToken, listId, itemId)
      items.value = sortItemsByPosition(
        items.value
          .filter((item) => item.id !== itemId && item.book_list_item_id !== itemId)
          .map((item, index) => ({
            ...item,
            position: index + 1,
          })),
      )
      feedbackMessage.value = 'Livro removido da lista.'
    } catch (error) {
      errorMessage.value = mapRemoveItemError(error)
      throw error
    } finally {
      removingItemId.value = null
    }
  }

  async function searchBooks(search: string) {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      return
    }

    const normalizedSearch = search.trim()

    if (normalizedSearch.length === 0) {
      searchResults.value = []
      return
    }

    isSearching.value = true
    errorMessage.value = ''

    try {
      const response = await searchBooksRequest(authStore.accessToken, normalizedSearch)
      searchResults.value = response.items
    } catch (error) {
      searchResults.value = []
      errorMessage.value = mapSearchBooksError(error)
    } finally {
      isSearching.value = false
    }
  }

  async function addExistingBook(listId: string, bookId: string) {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      throw new Error('missing access token')
    }

    isAddingBook.value = true
    errorMessage.value = ''
    feedbackMessage.value = ''

    try {
      await addExistingBookToListRequest(authStore.accessToken, listId, bookId)
      searchResults.value = []
      await fetchListDetail(listId)
      feedbackMessage.value = 'Livro adicionado à lista.'
    } catch (error) {
      errorMessage.value = mapAddBookError(error)
      throw error
    } finally {
      isAddingBook.value = false
    }
  }

  async function addManualBook(
    listId: string,
    input: {
      title: string
      author: string
      cover_url?: string
    },
  ) {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      throw new Error('missing access token')
    }

    isAddingBook.value = true
    errorMessage.value = ''
    feedbackMessage.value = ''

    try {
      await addManualBookToListRequest(authStore.accessToken, listId, {
        title: input.title.trim(),
        author: input.author.trim(),
        cover_url: trimOptionalCoverUrl(input.cover_url),
      })
      await fetchListDetail(listId)
      feedbackMessage.value = 'Livro adicionado à lista.'
    } catch (error) {
      errorMessage.value = mapAddBookError(error)
      throw error
    } finally {
      isAddingBook.value = false
    }
  }

  async function fetchAvailableLists() {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      availableLists.value = []
      return
    }

    isLoadingLists.value = true

    try {
      const response = await fetchListsRequest(authStore.accessToken)
      availableLists.value = response.items
    } catch (error) {
      availableLists.value = []
      errorMessage.value = mapFetchListDetailError(error)
    } finally {
      isLoadingLists.value = false
    }
  }

  async function reorderItem(listId: string, itemId: string, position: number) {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      throw new Error('missing access token')
    }

    reorderingItemId.value = itemId
    errorMessage.value = ''
    feedbackMessage.value = ''

    try {
      await reorderListItemRequest(authStore.accessToken, listId, itemId, position)
      await fetchListDetail(listId)
      feedbackMessage.value = 'Ordem atualizada com sucesso.'
    } catch (error) {
      errorMessage.value = mapReorderError(error)
      throw error
    } finally {
      reorderingItemId.value = null
    }
  }

  async function moveItemToList(
    listId: string,
    itemId: string,
    targetListId: string,
    targetPosition: number,
  ) {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      throw new Error('missing access token')
    }

    movingItemId.value = itemId
    errorMessage.value = ''
    feedbackMessage.value = ''

    try {
      await moveListItemRequest(authStore.accessToken, listId, itemId, {
        target_list_id: targetListId,
        target_position: targetPosition,
      })
      await fetchListDetail(listId)
      feedbackMessage.value = 'Livro movido com sucesso.'
    } catch (error) {
      errorMessage.value = mapMoveError(error)
      throw error
    } finally {
      movingItemId.value = null
    }
  }

  return {
    list,
    items,
    availableLists,
    searchResults,
    isLoading,
    isSearching,
    isAddingBook,
    isLoadingLists,
    reorderingItemId,
    movingItemId,
    removingItemId,
    errorMessage,
    feedbackMessage,
    addExistingBook,
    addManualBook,
    fetchListDetail,
    fetchAvailableLists,
    moveItemToList,
    reorderItem,
    removeItem,
    searchBooks,
  }
})
