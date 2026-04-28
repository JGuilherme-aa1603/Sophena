<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { IonButton, IonCard, IonCardContent, IonContent, IonPage, IonSpinner } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'

import { useListDetailStore } from '@/stores/list-detail'

const router = useRouter()
const route = useRoute()
const listDetailStore = useListDetailStore()

const searchForm = reactive({
  term: '',
})

const manualForm = reactive({
  title: '',
  author: '',
  cover_url: '',
  cover_file: undefined as File | undefined,
})
const expandedMoveItemId = ref<string | null>(null)
const moveTargets = reactive<Record<string, string>>({})

const listId = computed(() => {
  if (typeof route.params.listId === 'string') {
    return route.params.listId
  }

  if (Array.isArray(route.params.listId)) {
    return route.params.listId[0] ?? ''
  }

  return ''
})

const pageTitle = computed(() => listDetailStore.list?.name ?? 'Sua lista')

const showEmptyState = computed(() => {
  return !listDetailStore.isLoading
    && listDetailStore.items.length === 0
    && !listDetailStore.errorMessage
})

onMounted(async () => {
  await listDetailStore.fetchListDetail(listId.value)
})

async function goBack() {
  await router.push('/app')
}

async function removeBook(itemId: string) {
  try {
    await listDetailStore.removeItem(listId.value, itemId)
  } catch {
    // A mensagem amigável já é definida no store.
  }
}

async function submitBookSearch() {
  await listDetailStore.searchBooks(searchForm.term)
}

async function chooseExistingBook(bookId: string) {
  try {
    await listDetailStore.addExistingBook(listId.value, bookId)
    searchForm.term = ''
  } catch {
    // A mensagem amigável já é definida no store.
  }
}

async function submitManualBook() {
  try {
    await listDetailStore.addManualBook(listId.value, {
      title: manualForm.title,
      author: manualForm.author,
      cover_url: manualForm.cover_url,
      cover_file: manualForm.cover_file,
    })
    manualForm.title = ''
    manualForm.author = ''
    manualForm.cover_url = ''
    manualForm.cover_file = undefined
  } catch {
    // A mensagem amigável já é definida no store.
  }
}

function updateManualCoverFile(event: Event) {
  const input = event.target as HTMLInputElement
  manualForm.cover_file = input.files?.[0] ?? undefined
}

async function moveUp(itemId: string, currentPosition: number) {
  if (currentPosition <= 1) {
    return
  }

  try {
    await listDetailStore.reorderItem(listId.value, itemId, currentPosition - 1)
  } catch {
    // A mensagem amigável já é definida no store.
  }
}

async function moveDown(itemId: string, currentPosition: number) {
  if (currentPosition >= listDetailStore.items.length) {
    return
  }

  try {
    await listDetailStore.reorderItem(listId.value, itemId, currentPosition + 1)
  } catch {
    // A mensagem amigável já é definida no store.
  }
}

async function openMoveMenu(itemId: string) {
  expandedMoveItemId.value = itemId
  await listDetailStore.fetchAvailableLists()
}

async function confirmMove(itemId: string) {
  const targetListId = moveTargets[itemId] ?? ''

  if (!targetListId) {
    listDetailStore.errorMessage = 'Escolha a lista para onde deseja enviar o livro.'
    return
  }

  try {
    await listDetailStore.moveItemToList(listId.value, itemId, targetListId, 1)
    expandedMoveItemId.value = null
    delete moveTargets[itemId]
  } catch {
    // A mensagem amigável já é definida no store.
  }
}

const movableLists = computed(() => {
  return listDetailStore.availableLists.filter((availableList) => availableList.id !== listId.value)
})
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="list-detail-page">
        <section class="list-detail-shell">
          <header class="list-detail-header">
            <div>
              <p class="list-detail-kicker">Sophena</p>
              <h1>{{ pageTitle }}</h1>
              <p class="list-detail-subtitle">Veja os livros da sua lista, adicione novos títulos e remova o que não quiser mais aqui.</p>
            </div>

            <IonButton
              class="back-button"
              fill="outline"
              data-testid="back-to-lists"
              @click="goBack"
            >
              Voltar
            </IonButton>
          </header>

          <IonCard class="list-detail-card add-book-card">
            <IonCardContent>
              <div class="add-book-grid">
                <section class="add-book-section">
                  <h2>Escolher um livro já existente</h2>
                  <p>Se o livro já estiver cadastrado, você pode encontrá-lo pela busca.</p>

                  <form data-testid="search-books-form" class="add-book-form" @submit.prevent="submitBookSearch">
                    <label class="field">
                      <span>Buscar livro</span>
                      <input
                        name="book-search"
                        type="text"
                        autocomplete="off"
                        placeholder="Digite o nome do livro ou do autor"
                        :disabled="listDetailStore.isSearching || listDetailStore.isAddingBook"
                        v-model="searchForm.term"
                      />
                    </label>

                    <IonButton
                      type="submit"
                      class="action-button"
                      :disabled="listDetailStore.isSearching || listDetailStore.isAddingBook"
                    >
                      <span v-if="!listDetailStore.isSearching">Buscar</span>
                      <IonSpinner v-else name="crescent" />
                    </IonButton>
                  </form>

                  <p
                    v-if="!listDetailStore.isSearching && searchForm.term.trim().length > 0 && listDetailStore.searchResults.length === 0"
                    class="secondary-feedback"
                  >
                    Nenhum livro apareceu na busca. Se quiser, cadastre um novo logo ao lado.
                  </p>

                  <ul v-if="listDetailStore.searchResults.length > 0" class="search-results">
                    <li
                      v-for="book in listDetailStore.searchResults"
                      :key="book.id"
                      class="search-result-item"
                    >
                      <div class="search-result-content">
                        <strong>{{ book.title }}</strong>
                        <span>{{ book.author }}</span>
                      </div>

                      <IonButton
                        fill="outline"
                        class="pick-button"
                        :disabled="listDetailStore.isAddingBook"
                        :data-testid="`add-existing-book-${book.id}`"
                        @click="chooseExistingBook(book.id)"
                      >
                        Escolher
                      </IonButton>
                    </li>
                  </ul>
                </section>

                <section class="add-book-section">
                  <h2>Cadastrar um livro novo</h2>
                  <p>Use esta opção quando o livro ainda não aparecer na busca.</p>

                  <form data-testid="manual-book-form" class="add-book-form" @submit.prevent="submitManualBook">
                    <label class="field">
                      <span>Título</span>
                      <input
                        name="manual-title"
                        type="text"
                        autocomplete="off"
                        placeholder="Digite o título do livro"
                        :disabled="listDetailStore.isAddingBook"
                        v-model="manualForm.title"
                      />
                    </label>

                    <label class="field">
                      <span>Autor</span>
                      <input
                        name="manual-author"
                        type="text"
                        autocomplete="off"
                        placeholder="Digite o nome do autor"
                        :disabled="listDetailStore.isAddingBook"
                        v-model="manualForm.author"
                      />
                    </label>

                    <label class="field">
                      <span>Link da capa (opcional)</span>
                      <input
                        name="manual-cover-url"
                        type="url"
                        autocomplete="off"
                        placeholder="Cole o link da imagem, se quiser"
                        :disabled="listDetailStore.isAddingBook"
                        v-model="manualForm.cover_url"
                      />
                    </label>

                    <label class="field">
                      <span>Imagem da capa (opcional)</span>
                      <input
                        name="manual-cover-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        :disabled="listDetailStore.isAddingBook"
                        @change="updateManualCoverFile"
                      />
                    </label>

                    <IonButton
                      type="submit"
                      class="action-button"
                      :disabled="listDetailStore.isAddingBook"
                    >
                      <span v-if="!listDetailStore.isAddingBook">Adicionar livro</span>
                      <IonSpinner v-else name="crescent" />
                    </IonButton>
                  </form>
                </section>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard class="list-detail-card">
            <IonCardContent>
              <p
                v-if="listDetailStore.errorMessage"
                class="feedback-message error-message"
                role="status"
                aria-live="polite"
              >
                {{ listDetailStore.errorMessage }}
              </p>

              <p
                v-if="listDetailStore.feedbackMessage"
                class="feedback-message success-message"
                role="status"
                aria-live="polite"
              >
                {{ listDetailStore.feedbackMessage }}
              </p>

              <div
                v-if="listDetailStore.isLoading"
                class="loading-state"
                role="status"
                aria-live="polite"
              >
                <IonSpinner name="crescent" />
                <span>Carregando sua lista...</span>
              </div>

              <div v-else-if="showEmptyState" class="empty-state">
                <h2>Esta lista ainda não tem livros.</h2>
                <p>Quando você adicionar um livro, ele aparecerá aqui.</p>
              </div>

              <ol v-else class="items-list">
                <li
                  v-for="item in listDetailStore.items"
                  :key="item.book_list_item_id"
                  class="item-card"
                >
                  <div class="item-order" aria-hidden="true">
                    {{ item.position }}
                  </div>

                  <div class="item-cover">
                    <img
                      v-if="item.book.cover_url"
                      :src="item.book.cover_url"
                      :alt="`Capa do livro ${item.book.title}`"
                      class="item-cover-image"
                      :data-testid="`list-item-cover-${item.book_list_item_id}`"
                    />

                    <div
                      v-else
                      class="item-cover-fallback"
                      :data-testid="`list-item-cover-fallback-${item.book_list_item_id}`"
                    >
                      Sem capa
                    </div>
                  </div>

                  <div class="item-content">
                    <strong data-testid="list-item-title">{{ item.book.title }}</strong>
                    <span>{{ item.book.author }}</span>
                  </div>

                  <div class="item-actions">
                    <IonButton
                      fill="outline"
                      class="order-button"
                      :disabled="item.position === 1 || listDetailStore.reorderingItemId === item.book_list_item_id"
                      :data-testid="`move-up-${item.book_list_item_id}`"
                      @click="moveUp(item.book_list_item_id, item.position)"
                    >
                      Subir
                    </IonButton>

                    <IonButton
                      fill="outline"
                      class="order-button"
                      :disabled="item.position === listDetailStore.items.length || listDetailStore.reorderingItemId === item.book_list_item_id"
                      :data-testid="`move-down-${item.book_list_item_id}`"
                      @click="moveDown(item.book_list_item_id, item.position)"
                    >
                      Descer
                    </IonButton>

                    <IonButton
                      fill="outline"
                      class="move-button"
                      :data-testid="`open-move-${item.book_list_item_id}`"
                      :disabled="listDetailStore.movingItemId === item.book_list_item_id || listDetailStore.isLoadingLists"
                      @click="openMoveMenu(item.book_list_item_id)"
                    >
                      Mover
                    </IonButton>

                    <IonButton
                      fill="clear"
                      color="danger"
                      class="remove-button"
                      :disabled="listDetailStore.removingItemId === item.book_list_item_id"
                      :data-testid="`remove-item-${item.book_list_item_id}`"
                      @click="removeBook(item.book_list_item_id)"
                    >
                      <span v-if="listDetailStore.removingItemId !== item.book_list_item_id">Remover</span>
                      <IonSpinner v-else name="crescent" />
                    </IonButton>
                  </div>
                  
                  <div
                    v-if="expandedMoveItemId === item.book_list_item_id"
                    class="move-panel"
                  >
                    <label class="field">
                      <span>Enviar para</span>
                      <select
                        :name="`target-list-${item.book_list_item_id}`"
                        v-model="moveTargets[item.book_list_item_id]"
                      >
                        <option value="">Escolha uma lista</option>
                        <option
                          v-for="availableList in movableLists"
                          :key="availableList.id"
                          :value="availableList.id"
                        >
                          {{ availableList.name }}
                        </option>
                      </select>
                    </label>

                    <IonButton
                      fill="outline"
                      class="confirm-move-button"
                      :data-testid="`confirm-move-${item.book_list_item_id}`"
                      :disabled="listDetailStore.movingItemId === item.book_list_item_id"
                      @click="confirmMove(item.book_list_item_id)"
                    >
                      Confirmar envio
                    </IonButton>
                  </div>
                </li>
              </ol>
            </IonCardContent>
          </IonCard>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.list-detail-page {
  min-height: 100%;
  padding: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(223, 236, 221, 0.9), transparent 28%),
    radial-gradient(circle at bottom right, rgba(239, 229, 198, 0.8), transparent 28%),
    linear-gradient(180deg, #f6f2e8 0%, #fcfbf7 100%);
}

.list-detail-shell {
  width: min(100%, 46rem);
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.list-detail-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
}

.list-detail-kicker {
  margin-bottom: 0.45rem;
  color: #58715f;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.list-detail-header h1 {
  color: #20332b;
  font-family: 'Atkinson Hyperlegible', 'Trebuchet MS', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}

.list-detail-subtitle {
  margin-top: 0.65rem;
  color: #476055;
}

.list-detail-card {
  margin: 0;
  border-radius: 1.25rem;
  box-shadow: 0 18px 50px rgba(58, 71, 53, 0.1);
}

.add-book-grid {
  display: grid;
  gap: 1rem;
}

.add-book-section {
  display: grid;
  gap: 0.75rem;
}

.add-book-section h2 {
  color: #20332b;
  font-size: 1.15rem;
  font-weight: 700;
}

.add-book-section p {
  color: #4a5f55;
}

.add-book-form {
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

.action-button,
.pick-button {
  --border-radius: 0.95rem;
  font-weight: 700;
}

.action-button {
  --background: #335c47;
  --background-hover: #284b3a;
}

.secondary-feedback {
  color: #51665c;
}

.search-results {
  display: grid;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.search-result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border: 1px solid #d6decf;
  border-radius: 1rem;
  background: #fffdf9;
}

.search-result-content {
  display: grid;
  gap: 0.2rem;
  color: #22332c;
}

.search-result-content span {
  color: #51665c;
}

.feedback-message {
  margin-bottom: 1rem;
}

.error-message {
  color: #7c3b33;
}

.success-message {
  color: #2f5d42;
}

.loading-state,
.empty-state {
  display: grid;
  justify-items: start;
  gap: 0.65rem;
  color: #43584d;
}

.empty-state h2 {
  color: #20332b;
  font-size: 1.15rem;
  font-weight: 700;
}

.items-list {
  display: grid;
  gap: 0.85rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.item-card {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 0.9rem;
  align-items: center;
  padding: 1rem 1.1rem;
  border: 1px solid #d6decf;
  border-radius: 1rem;
  background: #fffdf9;
}

.item-order {
  width: 2.1rem;
  height: 2.1rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #e3ebdf;
  color: #244234;
  font-weight: 700;
}

.item-content {
  display: grid;
  gap: 0.2rem;
  color: #22332c;
}

.item-content span {
  color: #51665c;
}

.item-cover {
  width: 4rem;
  height: 5.75rem;
  border-radius: 0.85rem;
  overflow: hidden;
  background: #eef3ea;
  border: 1px solid #d6decf;
}

.item-cover-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.item-cover-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 0.5rem;
  text-align: center;
  color: #58715f;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.2;
}

.item-actions {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  justify-content: flex-end;
}

.back-button {
  --color: #335c47;
  --border-color: #335c47;
  --border-radius: 0.95rem;
}

.order-button,
.move-button,
.confirm-move-button {
  --border-radius: 0.95rem;
  font-weight: 700;
}

.remove-button {
  --color: #8a4339;
  font-weight: 700;
}

.move-panel {
  grid-column: 1 / -1;
  display: grid;
  gap: 0.75rem;
  margin-top: 0.35rem;
}

.move-panel select {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid #c7d1c2;
  border-radius: 0.9rem;
  background: #fffdf9;
  font: inherit;
  color: #1c2b25;
}

@media (min-width: 768px) {
  .add-book-grid {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

@media (max-width: 640px) {
  .list-detail-header {
    flex-direction: column;
  }

  .search-result-item {
    flex-direction: column;
    align-items: stretch;
  }

  .item-card {
    grid-template-columns: auto 4rem 1fr;
  }

  .remove-button {
    justify-self: end;
  }
}
</style>
