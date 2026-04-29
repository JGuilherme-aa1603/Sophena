<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { IonCard, IonCardContent, IonSpinner } from '@ionic/vue'

import BookCard from '@/components/books/BookCard.vue'
import BookListControlsMenu from '@/components/books/BookListControlsMenu.vue'
import EmptyStateCard from '@/components/feedback/EmptyStateCard.vue'
import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
import { useBooksStore, type BookCoverFilter } from '@/stores/books'

const booksStore = useBooksStore()
const BOOKS_LAYOUT_STORAGE_KEY = 'sophena:books-layout'
const filtersForm = reactive({
  search: '',
  author: '',
  cover: 'all' as BookCoverFilter,
})
const booksLayout = ref<'comfortable' | 'compact'>('comfortable')

const isCompactLayout = computed(() => booksLayout.value === 'compact')
const showEmptyState = computed(() => {
  return !booksStore.isLoading
    && booksStore.books.length === 0
    && !booksStore.errorMessage
})

onMounted(async () => {
  booksLayout.value = readSavedBooksLayout()
  await booksStore.fetchBooks()
})

async function submitFilters(filters: {
  search: string
  author: string
  cover: BookCoverFilter
}) {
  filtersForm.search = filters.search
  filtersForm.author = filters.author
  filtersForm.cover = filters.cover
  await booksStore.fetchBooks(filters)
}

async function clearFilters() {
  filtersForm.search = ''
  filtersForm.author = ''
  filtersForm.cover = 'all'
  await booksStore.clearFilters()
}

function setBooksLayout(layout: 'comfortable' | 'compact') {
  booksLayout.value = layout
  localStorage.setItem(BOOKS_LAYOUT_STORAGE_KEY, layout)
}

function readSavedBooksLayout() {
  const savedLayout = localStorage.getItem(BOOKS_LAYOUT_STORAGE_KEY)
  return savedLayout === 'compact' ? 'compact' : 'comfortable'
}
</script>

<template>
  <AuthenticatedScaffold page-class="books-page">
    <header class="app-page-header">
      <div class="app-page-header__title">
        <p class="app-page-kicker">Sophena</p>
        <h1 class="app-page-title">Livros do sistema</h1>
        <p class="app-page-subtitle">
          Veja os livros já cadastrados no Sophena e encontre títulos pelo nome, autor ou presença de capa.
        </p>
      </div>
    </header>

    <IonCard class="app-card books-card">
      <IonCardContent class="books-content">
        <div class="search-intro">
          <div>
            <p class="search-kicker">Acervo</p>
            <h2>Encontrar livros</h2>
          </div>
          <p>Use filtros simples para navegar pelos livros cadastrados.</p>
        </div>

        <BookListControlsMenu
          test-id-prefix="books"
          :layout="booksLayout"
          :is-loading="booksStore.isLoading"
          @search="submitFilters"
          @clear="clearFilters"
          @update:layout="setBooksLayout"
        />

        <p
          v-if="booksStore.errorMessage"
          class="app-feedback app-feedback--error"
          role="status"
          aria-live="polite"
        >
          {{ booksStore.errorMessage }}
        </p>

        <div v-if="booksStore.isLoading" class="loading-state" role="status" aria-live="polite">
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
          description="Tente buscar outro nome, autor ou filtro de capa."
        />

        <ul
          v-else
          class="books-list app-fade-in"
          :class="{
            'books-list--comfortable': !isCompactLayout,
            'books-list--compact': isCompactLayout,
          }"
          data-testid="books-list"
        >
          <li v-for="book in booksStore.books" :key="book.id" class="book-item">
            <BookCard
              :title="book.title"
              :author="book.author"
              :cover-url="book.cover_url"
              :layout="booksLayout"
            />
          </li>
        </ul>
      </IonCardContent>
    </IonCard>
  </AuthenticatedScaffold>
</template>

<style scoped>
.books-content,
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

@media (min-width: 768px) {
  .books-list--compact {
    grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
  }
}
</style>
