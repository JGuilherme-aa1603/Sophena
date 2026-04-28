<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { IonButton, IonCard, IonCardContent, IonContent, IonPage, IonSpinner } from '@ionic/vue'
import { useRouter } from 'vue-router'

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
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="admin-books-page">
        <section class="admin-books-shell">
          <header class="admin-books-header">
            <div>
              <p class="admin-books-kicker">Sophena</p>
              <h1>Gerenciar livros</h1>
              <p class="admin-books-subtitle">Encontre um livro pelo título ou autor e apague o que não deve mais ficar no sistema.</p>
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

          <IonCard class="admin-books-card">
            <IonCardContent>
              <form data-testid="admin-books-search-form" class="search-form" @submit.prevent="submitSearch">
                <label class="field">
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
                class="feedback-message error-message"
                role="status"
                aria-live="polite"
              >
                {{ adminBooksStore.errorMessage }}
              </p>

              <p
                v-if="adminBooksStore.feedbackMessage"
                class="feedback-message success-message"
                role="status"
                aria-live="polite"
              >
                {{ adminBooksStore.feedbackMessage }}
              </p>

              <div v-if="adminBooksStore.isLoading" class="loading-state" role="status" aria-live="polite">
                <IonSpinner name="crescent" />
                <span>Carregando os livros...</span>
              </div>

              <div v-else-if="showEmptyState" class="empty-state">
                <h2>Nenhum livro foi encontrado.</h2>
                <p>Tente buscar outro nome ou outro autor.</p>
              </div>

              <ul v-else class="books-list">
                <li v-for="book in adminBooksStore.books" :key="book.id" class="book-item">
                  <div class="book-info">
                    <strong>{{ book.title }}</strong>
                    <span>{{ book.author }}</span>
                  </div>

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
                </li>
              </ul>
            </IonCardContent>
          </IonCard>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.admin-books-page {
  min-height: 100%;
  padding: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(223, 236, 221, 0.9), transparent 28%),
    radial-gradient(circle at bottom right, rgba(239, 229, 198, 0.8), transparent 28%),
    linear-gradient(180deg, #f6f2e8 0%, #fcfbf7 100%);
}

.admin-books-shell {
  width: min(100%, 46rem);
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.admin-books-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
}

.admin-books-kicker {
  margin-bottom: 0.45rem;
  color: #58715f;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-books-header h1 {
  color: #20332b;
  font-family: 'Atkinson Hyperlegible', 'Trebuchet MS', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}

.admin-books-subtitle {
  margin-top: 0.65rem;
  color: #476055;
}

.admin-books-card {
  margin: 0;
  border-radius: 1.25rem;
  box-shadow: 0 18px 50px rgba(58, 71, 53, 0.1);
}

.search-form {
  display: grid;
  gap: 0.85rem;
}

.field {
  display: grid;
  gap: 0.45rem;
  color: #22332c;
}

.field span {
  font-weight: 700;
}

.field input {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid #c7d1c2;
  border-radius: 0.9rem;
  background: #fffdf9;
  font: inherit;
  color: #1c2b25;
}

.field input:focus {
  outline: 3px solid rgba(78, 129, 102, 0.2);
  border-color: #4e8166;
}

.search-button {
  --background: #335c47;
  --background-hover: #284b3a;
  --border-radius: 0.95rem;
  min-height: 3rem;
  font-weight: 700;
}

.feedback-message {
  margin: 0.85rem 0 0;
}

.error-message {
  color: #7c3b33;
}

.success-message {
  color: #2f5d42;
}

.loading-state,
.empty-state {
  margin-top: 1rem;
  display: grid;
  gap: 0.5rem;
  justify-items: center;
  text-align: center;
  color: #476055;
}

.books-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  display: grid;
  gap: 0.85rem;
}

.book-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.95rem 1rem;
  border: 1px solid #d7dfd4;
  border-radius: 1rem;
  background: #fffdf9;
}

.book-info {
  display: grid;
  gap: 0.2rem;
  color: #20332b;
}

.book-info span {
  color: #476055;
}

.delete-button {
  --border-radius: 0.9rem;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .book-item,
  .admin-books-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
