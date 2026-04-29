<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { IonButton, IonCard, IonCardContent, IonSpinner } from '@ionic/vue'
import { useRouter } from 'vue-router'

import BookCard from '@/components/books/BookCard.vue'
import EmptyStateCard from '@/components/feedback/EmptyStateCard.vue'
import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
import { useAdminBooksStore } from '@/stores/admin-books'

const router = useRouter()
const adminBooksStore = useAdminBooksStore()
const searchForm = reactive({
  term: '',
})

const showEmptyState = computed(() => {
  return !adminBooksStore.isLoading
    && adminBooksStore.books.length === 0
    && !adminBooksStore.errorMessage
})

onMounted(async () => {
  await adminBooksStore.fetchBooks()
})

async function submitSearch() {
  await adminBooksStore.fetchBooks(searchForm.term)
}

async function requestDeleteBook(bookId: string) {
  try {
    await adminBooksStore.requestDeleteBook(bookId)
  } catch (error) {
    if ((error as Error).message !== 'confirmation required') {
      return
    }

    const pendingDeletion = adminBooksStore.pendingDeletion

    if (!pendingDeletion || pendingDeletion.bookId !== bookId) {
      return
    }

    const listLabel = pendingDeletion.removedFromListsCount === 1 ? 'lista' : 'listas'
    const confirmed = window.confirm(
      `Esse livro está em ${pendingDeletion.removedFromListsCount} ${listLabel}. Se continuar, ele será removido dessas listas e apagado do sistema. Deseja continuar?`,
    )

    if (!confirmed) {
      adminBooksStore.clearPendingDeletion()
      return
    }

    await adminBooksStore.confirmDeleteBook(bookId)
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

        <form data-testid="admin-books-search-form" class="search-form" @submit.prevent="submitSearch">
          <label class="app-field">
            <span>Buscar livro</span>
            <input
              name="admin-book-search"
              type="text"
              autocomplete="off"
              placeholder="Digite o título ou o autor"
              :disabled="adminBooksStore.isLoading"
              v-model="searchForm.term"
            />
          </label>

          <IonButton class="search-button" type="submit" :disabled="adminBooksStore.isLoading">
            <span v-if="!adminBooksStore.isLoading">Buscar</span>
            <IonSpinner v-else name="crescent" />
          </IonButton>
        </form>

        <p
          v-if="adminBooksStore.errorMessage"
          class="app-feedback app-feedback--error"
          role="status"
          aria-live="polite"
        >
          {{ adminBooksStore.errorMessage }}
        </p>

        <p
          v-if="adminBooksStore.feedbackMessage"
          class="app-feedback app-feedback--success"
          role="status"
          aria-live="polite"
        >
          {{ adminBooksStore.feedbackMessage }}
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

        <ul v-else class="books-list app-fade-in">
          <li v-for="book in adminBooksStore.books" :key="book.id" class="book-item">
            <BookCard
              :title="book.title"
              :author="book.author"
              :cover-url="book.cover_url"
            >
              <template #actions>
                <IonButton
                  fill="outline"
                  color="danger"
                  class="delete-button"
                  :disabled="adminBooksStore.isDeleting"
                  :data-testid="`delete-book-${book.id}`"
                  @click="requestDeleteBook(book.id)"
                >
                  Apagar
                </IonButton>
              </template>
            </BookCard>
          </li>
        </ul>
      </IonCardContent>
    </IonCard>
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

.search-form {
  display: grid;
  gap: var(--space-sm);
}

.search-button {
  --background: var(--color-primary);
  --background-hover: var(--color-primary-hover);
  --border-radius: var(--radius-lg);
  --box-shadow: var(--shadow-md);
  min-height: 3rem;
  font-weight: 700;
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
  padding: 0;
}

.book-item {
  display: block;
}

.delete-button {
  --border-radius: var(--radius-lg);
  flex-shrink: 0;
}
</style>
