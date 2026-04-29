<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { IonButton, IonCard, IonCardContent, IonIcon, IonSpinner } from '@ionic/vue'
import { ellipsisHorizontalOutline, trashOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'

import BookCard from '@/components/books/BookCard.vue'
import BookListControlsMenu from '@/components/books/BookListControlsMenu.vue'
import EmptyStateCard from '@/components/feedback/EmptyStateCard.vue'
import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
import AppConfirmSheet from '@/components/overlay/AppConfirmSheet.vue'
import ResponsiveSheetModal from '@/components/overlay/ResponsiveSheetModal.vue'
import { useAdminBooksStore } from '@/stores/admin-books'
import type { BookCoverFilter } from '@/stores/books'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const adminBooksStore = useAdminBooksStore()
const toastStore = useToastStore()
const ADMIN_BOOKS_LAYOUT_STORAGE_KEY = 'sophena:admin-books-layout'
const filtersForm = reactive({
  search: '',
  author: '',
  cover: 'all' as BookCoverFilter,
})
const activeOptionsBookId = ref<string | null>(null)
const pendingDeleteBookId = ref<string | null>(null)
const deleteMode = ref<'initial' | 'force'>('initial')
const booksLayout = ref<'comfortable' | 'compact'>('comfortable')

const showEmptyState = computed(() => {
  return !adminBooksStore.isLoading
    && adminBooksStore.books.length === 0
    && !adminBooksStore.errorMessage
})
const isCompactLayout = computed(() => booksLayout.value === 'compact')
const inlineErrorMessage = computed(() => {
  if (pendingDeleteBookId.value) {
    return ''
  }

  return adminBooksStore.errorMessage
})

const optionsBook = computed(() => {
  if (!activeOptionsBookId.value) {
    return null
  }

  return adminBooksStore.books.find((book) => book.id === activeOptionsBookId.value) ?? null
})

const isBookOptionsOpen = computed({
  get: () => Boolean(activeOptionsBookId.value),
  set: (value: boolean) => {
    if (!value) {
      activeOptionsBookId.value = null
    }
  },
})

const isDeleteConfirmOpen = computed({
  get: () => Boolean(pendingDeleteBookId.value),
  set: (value: boolean) => {
    if (!value) {
      cancelDeleteBook()
    }
  },
})

const deleteConfirmTitle = computed(() => {
  return deleteMode.value === 'force' ? 'Apagar mesmo assim?' : 'Apagar livro do sistema?'
})

const deleteConfirmMessage = computed(() => {
  if (deleteMode.value === 'force') {
    const count = adminBooksStore.pendingDeletion?.removedFromListsCount ?? 0
    const listLabel = count === 1 ? 'lista' : 'listas'

    return `Esse livro está em ${count} ${listLabel}. Se continuar, ele será removido dessas listas e apagado do sistema.`
  }

  return 'Essa ação apaga o livro para todos os usuários. Se ele estiver em listas, o Sophena pedirá uma confirmação extra.'
})

const deleteConfirmLabel = computed(() => {
  return deleteMode.value === 'force' ? 'Apagar mesmo assim' : 'Apagar livro'
})

onMounted(async () => {
  booksLayout.value = readSavedBooksLayout()
  await adminBooksStore.fetchBooks()
})

async function submitSearch(filters: {
  search: string
  author: string
  cover: BookCoverFilter
}) {
  filtersForm.search = filters.search
  filtersForm.author = filters.author
  filtersForm.cover = filters.cover
  await adminBooksStore.fetchBooks(filters)
}

async function clearFilters() {
  filtersForm.search = ''
  filtersForm.author = ''
  filtersForm.cover = 'all'
  await adminBooksStore.fetchBooks({
    search: '',
    author: '',
    cover: 'all',
  })
}

function openBookOptions(bookId: string) {
  activeOptionsBookId.value = bookId
}

function requestDeleteBook(bookId: string) {
  activeOptionsBookId.value = null
  pendingDeleteBookId.value = bookId
  deleteMode.value = 'initial'
}

function cancelDeleteBook() {
  pendingDeleteBookId.value = null
  deleteMode.value = 'initial'
  adminBooksStore.clearPendingDeletion()
}

function setBooksLayout(layout: 'comfortable' | 'compact') {
  booksLayout.value = layout
  localStorage.setItem(ADMIN_BOOKS_LAYOUT_STORAGE_KEY, layout)
}

function readSavedBooksLayout() {
  const savedLayout = localStorage.getItem(ADMIN_BOOKS_LAYOUT_STORAGE_KEY)
  return savedLayout === 'compact' ? 'compact' : 'comfortable'
}

async function confirmDeleteBook() {
  if (!pendingDeleteBookId.value) {
    return
  }

  const bookId = pendingDeleteBookId.value

  try {
    if (deleteMode.value === 'force') {
      await adminBooksStore.confirmDeleteBook(bookId)
    } else {
      await adminBooksStore.requestDeleteBook(bookId)
    }

    pendingDeleteBookId.value = null
    deleteMode.value = 'initial'
    toastStore.showSuccess('Livro apagado com sucesso.')
  } catch (error) {
    if ((error as Error).message !== 'confirmation required') {
      toastStore.showError(adminBooksStore.errorMessage || 'Não foi possível apagar o livro agora.')
      return
    }

    const pendingDeletion = adminBooksStore.pendingDeletion

    if (!pendingDeletion || pendingDeletion.bookId !== bookId) {
      return
    }

    deleteMode.value = 'force'
  }
}

async function goBack() {
  await router.push('/app/admin')
}
</script>

<template>
  <AuthenticatedScaffold page-class="admin-books-page">
    <header class="app-page-header">
      <div class="app-page-header__title">
        <p class="app-page-kicker">Sophena</p>
        <h1 class="app-page-title">Gerenciar livros</h1>
        <p class="app-page-subtitle">
          Encontre um livro pelo título ou autor e apague o que não deve mais ficar no sistema.
        </p>
      </div>

      <IonButton
        class="back-button"
        fill="outline"
        data-testid="back-to-admin-home"
        @click="goBack"
      >
        Voltar
      </IonButton>
    </header>

    <IonCard class="app-card admin-books-card">
      <IonCardContent class="admin-books-content">
        <div class="search-intro">
          <div>
            <p class="search-kicker">Busca</p>
            <h2>Encontrar livro</h2>
          </div>
          <p>Use uma busca simples para localizar rapidamente o título que precisa revisar.</p>
        </div>

        <BookListControlsMenu
          test-id-prefix="admin-books"
          form-testid="admin-books-search-form"
          search-name="admin-book-search"
          author-name="admin-book-author"
          cover-name="admin-book-cover"
          :layout="booksLayout"
          :is-loading="adminBooksStore.isLoading"
          @search="submitSearch"
          @clear="clearFilters"
          @update:layout="setBooksLayout"
        />

        <p
          v-if="inlineErrorMessage"
          class="app-feedback app-feedback--error"
          role="status"
          aria-live="polite"
        >
          {{ inlineErrorMessage }}
        </p>

        <div v-if="adminBooksStore.isLoading" class="loading-state" role="status" aria-live="polite">
          <IonSpinner name="crescent" />
          <span>Carregando os livros...</span>
          <div class="loading-skeleton-list" aria-hidden="true">
            <div v-for="index in 3" :key="index" class="app-skeleton-card">
              <div class="app-skeleton app-skeleton-text app-skeleton-text--medium"></div>
              <div class="app-skeleton app-skeleton-text app-skeleton-text--long"></div>
            </div>
          </div>
        </div>

        <EmptyStateCard
          v-else-if="showEmptyState"
          title="Nenhum livro foi encontrado."
          description="Tente buscar outro nome ou outro autor."
        />

        <ul
          v-else
          class="books-list app-fade-in"
          :class="{
            'books-list--comfortable': !isCompactLayout,
            'books-list--compact': isCompactLayout,
          }"
          data-testid="admin-books-list"
        >
          <li v-for="book in adminBooksStore.books" :key="book.id" class="book-item">
            <BookCard
              :title="book.title"
              :author="book.author"
              :cover-url="book.cover_url"
              :layout="booksLayout"
            >
              <template #actions>
                <IonButton
                  fill="clear"
                  class="options-button options-button--icon-only"
                  :disabled="adminBooksStore.isDeleting"
                  :data-testid="`open-admin-book-options-${book.id}`"
                  :aria-label="`Ver opções do livro ${book.title}`"
                  :title="`Ver opções do livro ${book.title}`"
                  @click="openBookOptions(book.id)"
                >
                  <IonIcon :icon="ellipsisHorizontalOutline" aria-hidden="true" />
                </IonButton>
              </template>
            </BookCard>
          </li>
        </ul>
      </IonCardContent>
    </IonCard>

    <ResponsiveSheetModal
      v-model="isBookOptionsOpen"
      title="Opções do livro"
      description="Escolha o que deseja fazer com este livro."
      panel-testid="admin-book-options-sheet"
      close-testid="close-admin-book-options"
    >
      <div v-if="optionsBook" class="admin-book-options">
        <BookCard
          :title="optionsBook.title"
          :author="optionsBook.author"
          :cover-url="optionsBook.cover_url"
        />

        <IonButton
          fill="outline"
          color="danger"
          class="delete-button"
          :disabled="adminBooksStore.isDeleting"
          :data-testid="`request-delete-book-${optionsBook.id}`"
          @click="requestDeleteBook(optionsBook.id)"
        >
          <span class="button-inline-content">
            <IonIcon :icon="trashOutline" aria-hidden="true" />
            Apagar
          </span>
        </IonButton>

        <div
          class="admin-book-options-bottom-spacer"
          aria-hidden="true"
          data-testid="admin-book-options-bottom-spacer"
        ></div>
      </div>
    </ResponsiveSheetModal>

    <AppConfirmSheet
      v-model="isDeleteConfirmOpen"
      :title="deleteConfirmTitle"
      :message="deleteConfirmMessage"
      :confirm-label="deleteConfirmLabel"
      cancel-label="Cancelar"
      tone="danger"
      panel-testid="admin-delete-book-confirm-sheet"
      @confirm="confirmDeleteBook"
    />
  </AuthenticatedScaffold>
</template>

<style scoped>
.back-button {
  --color: var(--color-primary);
  --border-color: var(--color-primary);
  --border-radius: var(--radius-lg);
}

.admin-books-content,
.search-intro {
  display: grid;
  gap: var(--space-md);
}

.search-kicker {
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.search-intro h2 {
  color: var(--color-heading);
  font-size: 22px;
  font-weight: 600;
}

.search-intro p {
  color: var(--color-muted);
}

.button-inline-content {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
}

.loading-state {
  display: grid;
  gap: var(--space-sm);
  justify-items: start;
  color: var(--color-muted);
}

.loading-skeleton-list {
  width: min(100%, 32rem);
  display: grid;
  gap: var(--space-sm);
}

.books-list {
  display: grid;
  gap: var(--space-sm);
  list-style: none;
  margin: 0;
  padding: 0;
}

.books-list--compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.book-item {
  display: grid;
}

.admin-book-options {
  display: grid;
  gap: var(--space-md);
}

.admin-book-options-bottom-spacer {
  min-height: var(--space-sm);
}

.options-button {
  --color: var(--color-muted);
  --box-shadow: none;
  margin: 0;
}

.options-button--icon-only {
  --border-radius: 999px;
  --padding-start: 0.32rem;
  --padding-end: 0.32rem;
  min-width: 2.2rem;
  min-height: 2.2rem;
  border: 1px solid rgba(95, 111, 102, 0.22);
  border-radius: 999px;
  background: rgba(243, 242, 239, 0.68);
  font-weight: 700;
}

.delete-button {
  --border-radius: var(--radius-lg);
  min-height: 3rem;
  font-weight: 700;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .books-list--compact {
    grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
  }
}
</style>
