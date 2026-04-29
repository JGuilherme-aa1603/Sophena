import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'

import { ApiError } from '@/lib/api/http'
import {
  fetchBooksRequest,
  type BookCoverFilter,
  type BookSearchResult,
  type FetchBooksFilters,
} from '@/lib/api/books'
import { useAuthStore } from './auth'

function mapFetchBooksError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Sua sessão expirou. Entre novamente.'
  }

  return 'Não foi possível carregar os livros agora.'
}

export const useBooksStore = defineStore('books', () => {
  const authStore = useAuthStore()
  const books = ref<BookSearchResult[]>([])
  const filters = reactive<Required<FetchBooksFilters>>({
    search: '',
    author: '',
    cover: 'all',
  })
  const isLoading = ref(false)
  const errorMessage = ref('')

  async function fetchBooks(input: FetchBooksFilters = {}) {
    if (!authStore.accessToken) {
      books.value = []
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      return
    }

    filters.search = input.search ?? filters.search
    filters.author = input.author ?? filters.author
    filters.cover = input.cover ?? filters.cover
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await fetchBooksRequest(authStore.accessToken, {
        search: filters.search,
        author: filters.author,
        cover: filters.cover,
      })
      books.value = response.items
    } catch (error) {
      books.value = []
      errorMessage.value = mapFetchBooksError(error)
    } finally {
      isLoading.value = false
    }
  }

  async function clearFilters() {
    filters.search = ''
    filters.author = ''
    filters.cover = 'all'
    await fetchBooks({
      search: '',
      author: '',
      cover: 'all',
    })
  }

  return {
    books,
    filters,
    isLoading,
    errorMessage,
    clearFilters,
    fetchBooks,
  }
})

export type { BookCoverFilter }
