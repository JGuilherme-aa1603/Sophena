import { ref } from 'vue'
import { defineStore } from 'pinia'

import {
  deleteBookRequest,
  fetchBooksRequest,
  type BookSearchResult,
} from '@/lib/api/books'
import { ApiError } from '@/lib/api/http'
import { useAuthStore } from './auth'

type PendingDeletion = {
  bookId: string
  removedFromListsCount: number
}

function mapAdminBooksError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'Você não tem permissão para apagar livros.'
    }

    if (error.status === 404) {
      return 'Esse livro não foi encontrado.'
    }
  }

  return 'Não foi possível carregar os livros agora.'
}

function mapDeleteBookError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'Você não tem permissão para apagar livros.'
    }

    if (error.status === 404) {
      return 'Esse livro não foi encontrado.'
    }
  }

  return 'Não foi possível apagar o livro agora.'
}

function readDeletionConfirmation(body: unknown): number | null {
  if (!body || typeof body !== 'object') {
    return null
  }

  const confirmationBody = body as {
    requires_confirmation?: unknown
    removed_from_lists_count?: unknown
  }

  if (confirmationBody.requires_confirmation !== true) {
    return null
  }

  return typeof confirmationBody.removed_from_lists_count === 'number'
    ? confirmationBody.removed_from_lists_count
    : 0
}

export const useAdminBooksStore = defineStore('admin-books', () => {
  const authStore = useAuthStore()
  const books = ref<BookSearchResult[]>([])
  const isLoading = ref(false)
  const isDeleting = ref(false)
  const errorMessage = ref('')
  const feedbackMessage = ref('')
  const pendingDeletion = ref<PendingDeletion | null>(null)

  async function fetchBooks(search = '') {
    if (!authStore.accessToken) {
      books.value = []
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      return
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await fetchBooksRequest(authStore.accessToken, search)
      books.value = response.items
    } catch (error) {
      books.value = []
      errorMessage.value = mapAdminBooksError(error)
    } finally {
      isLoading.value = false
    }
  }

  async function requestDeleteBook(bookId: string) {
    return deleteBook(bookId, false)
  }

  async function confirmDeleteBook(bookId: string) {
    return deleteBook(bookId, true)
  }

  function clearPendingDeletion() {
    pendingDeletion.value = null
  }

  async function deleteBook(bookId: string, force: boolean) {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      throw new Error('missing access token')
    }

    isDeleting.value = true
    errorMessage.value = ''
    feedbackMessage.value = ''

    try {
      await deleteBookRequest(authStore.accessToken, bookId, force)
      books.value = books.value.filter((book) => book.id !== bookId)
      pendingDeletion.value = null
      feedbackMessage.value = 'Livro apagado com sucesso.'
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const removedFromListsCount = readDeletionConfirmation(error.body)

        if (removedFromListsCount !== null) {
          pendingDeletion.value = {
            bookId,
            removedFromListsCount,
          }

          throw new Error('confirmation required')
        }
      }

      errorMessage.value = mapDeleteBookError(error)
      throw error
    } finally {
      isDeleting.value = false
    }
  }

  return {
    books,
    isLoading,
    isDeleting,
    errorMessage,
    feedbackMessage,
    pendingDeletion,
    fetchBooks,
    requestDeleteBook,
    confirmDeleteBook,
    clearPendingDeletion,
  }
})
