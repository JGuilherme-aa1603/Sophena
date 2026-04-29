<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { IonButton, IonCard, IonCardContent, IonIcon, IonSpinner } from '@ionic/vue'
import { searchOutline } from 'ionicons/icons'

import BookCard from '@/components/books/BookCard.vue'
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

async function submitFilters() {
  await booksStore.fetchBooks({
    search: filtersForm.search,
    author: filtersForm.author,
    cover: filtersForm.cover,
  })
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

        <div class="layout-toggle" aria-label="Escolher visualização dos livros">
          <span class="layout-toggle-label">Visualização</span>
          <div class="layout-toggle-actions">
            <button
              type="button"
              class="layout-toggle-button"
              :class="{ 'layout-toggle-button--active': !isCompactLayout }"
              data-testid="books-layout-comfortable"
              :aria-pressed="!isCompactLayout"
              @click="setBooksLayout('comfortable')"
            >
              Linha
            </button>

            <button
              type="button"
              class="layout-toggle-button"
              :class="{ 'layout-toggle-button--active': isCompactLayout }"
              data-testid="books-layout-compact"
              :aria-pressed="isCompactLayout"
              @click="setBooksLayout('compact')"
            >
              Compacta
            </button>
          </div>
        </div>

        <form data-testid="books-filters-form" class="filters-form" @submit.prevent="submitFilters">
          <label class="app-field">
            <span>Buscar livro</span>
            <input
              name="book-search"
              type="text"
              autocomplete="off"
              placeholder="Digite o título ou o autor"
              :disabled="booksStore.isLoading"
              v-model="filtersForm.search"
            />
          </label>

          <label class="app-field">
            <span>Filtrar por autor</span>
            <input
              name="book-author"
              type="text"
              autocomplete="off"
              placeholder="Digite o nome do autor"
              :disabled="booksStore.isLoading"
              v-model="filtersForm.author"
            />
          </label>

          <label class="app-field">
            <span>Capa</span>
            <select
              name="book-cover"
              :disabled="booksStore.isLoading"
              v-model="filtersForm.cover"
            >
              <option value="all">Todos</option>
              <option value="with">Com capa</option>
              <option value="without">Sem capa</option>
            </select>
          </label>

          <div class="filters-actions">
            <IonButton class="search-button" type="submit" :disabled="booksStore.isLoading">
              <span v-if="!booksStore.isLoading" class="button-inline-content">
                <IonIcon :icon="searchOutline" aria-hidden="true" />
                Buscar
              </span>
              <IonSpinner v-else name="crescent" />
            </IonButton>

            <IonButton
              fill="outline"
              class="clear-button"
              type="button"
              data-testid="clear-books-filters"
              :disabled="booksStore.isLoading"
              @click="clearFilters"
            >
              Limpar filtros
            </IonButton>
          </div>
        </form>

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
.search-intro,
.layout-toggle {
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

.filters-form {
  display: grid;
  gap: var(--space-sm);
}

.filters-actions {
  display: grid;
  gap: var(--space-sm);
}

.layout-toggle {
  justify-items: start;
}

.layout-toggle-label {
  color: var(--color-muted);
  font-size: 0.86rem;
  font-weight: 700;
}

.layout-toggle-actions {
  display: inline-flex;
  gap: 0.35rem;
  padding: 0.25rem;
  border: 1px solid rgba(226, 224, 219, 0.96);
  border-radius: 999px;
  background: rgba(243, 242, 239, 0.9);
}

.layout-toggle-button {
  min-height: 2.4rem;
  padding: 0.45rem 0.85rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-heading);
  font: inherit;
  font-weight: 700;
}

.layout-toggle-button--active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

.search-button,
.clear-button {
  --border-radius: var(--radius-lg);
  min-height: 3rem;
  font-weight: 700;
}

.search-button {
  --background: var(--color-primary);
  --background-hover: var(--color-primary-hover);
  --box-shadow: var(--shadow-md);
}

.clear-button {
  --color: var(--color-primary);
  --border-color: var(--color-primary);
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

@media (min-width: 768px) {
  .filters-actions {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .books-list--compact {
    grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
  }
}

@media (max-width: 640px) {
  .layout-toggle {
    width: 100%;
  }

  .layout-toggle-actions {
    width: 100%;
  }

  .layout-toggle-button {
    flex: 1;
    text-align: center;
  }
}
</style>
