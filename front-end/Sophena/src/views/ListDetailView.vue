<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { IonButton, IonCard, IonCardContent, IonIcon, IonSpinner } from '@ionic/vue'
import {
  addCircleOutline,
  arrowDownOutline,
  arrowUpOutline,
  ellipsisHorizontalOutline,
  searchOutline,
  swapHorizontalOutline,
  trashOutline,
} from 'ionicons/icons'
import { useRoute, useRouter } from 'vue-router'

import BookCard from '@/components/books/BookCard.vue'
import EmptyStateCard from '@/components/feedback/EmptyStateCard.vue'
import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
import AppConfirmSheet from '@/components/overlay/AppConfirmSheet.vue'
import ResponsiveSheetModal from '@/components/overlay/ResponsiveSheetModal.vue'
import { useListDetailStore } from '@/stores/list-detail'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const route = useRoute()
const listDetailStore = useListDetailStore()
const toastStore = useToastStore()

const searchForm = reactive({
  term: '',
})

const manualForm = reactive({
  title: '',
  author: '',
  cover_url: '',
  cover_file: undefined as File | undefined,
})

const isAddBookFlowOpen = ref(false)
const hasSearchedBooks = ref(false)
const showManualBookForm = ref(false)
const activeOptionsItemId = ref<string | null>(null)
const activeMoveItemId = ref<string | null>(null)
const pendingRemoveItemId = ref<string | null>(null)
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
const bookCountLabel = computed(() => {
  const total = listDetailStore.items.length
  return total === 1 ? '1 livro' : `${total} livros`
})

const showEmptyState = computed(() => {
  return !listDetailStore.isLoading
    && listDetailStore.items.length === 0
    && !listDetailStore.errorMessage
})

const movableLists = computed(() => {
  return listDetailStore.availableLists.filter((availableList) => availableList.id !== listId.value)
})

const movingItem = computed(() => {
  if (!activeMoveItemId.value) {
    return null
  }

  return listDetailStore.items.find((item) => item.book_list_item_id === activeMoveItemId.value) ?? null
})

const optionsItem = computed(() => {
  if (!activeOptionsItemId.value) {
    return null
  }

  return listDetailStore.items.find((item) => item.book_list_item_id === activeOptionsItemId.value) ?? null
})

const isMoveFlowOpen = computed({
  get: () => Boolean(activeMoveItemId.value),
  set: (value: boolean) => {
    if (!value) {
      activeMoveItemId.value = null
    }
  },
})

const isOptionsFlowOpen = computed({
  get: () => Boolean(activeOptionsItemId.value),
  set: (value: boolean) => {
    if (!value) {
      activeOptionsItemId.value = null
    }
  },
})

const isRemoveConfirmOpen = computed({
  get: () => Boolean(pendingRemoveItemId.value),
  set: (value: boolean) => {
    if (!value) {
      pendingRemoveItemId.value = null
    }
  },
})

const canShowManualBookPath = computed(() => {
  return hasSearchedBooks.value
    && !listDetailStore.isSearching
    && searchForm.term.trim().length > 0
    && listDetailStore.searchResults.length === 0
})

const inlineErrorMessage = computed(() => {
  if (
    listDetailStore.errorMessage === 'Esse livro já está nesta lista.'
    || listDetailStore.errorMessage === 'Esse livro já está na lista de destino.'
  ) {
    return ''
  }

  return listDetailStore.errorMessage
})

onMounted(async () => {
  await listDetailStore.fetchListDetail(listId.value)
})

async function goBack() {
  await router.push('/app')
}

function openAddBookFlow() {
  isAddBookFlowOpen.value = true
  hasSearchedBooks.value = false
  showManualBookForm.value = false
}

function closeAddBookFlow() {
  isAddBookFlowOpen.value = false
}

function openBookOptions(itemId: string) {
  activeOptionsItemId.value = itemId
}

function closeBookOptions() {
  activeOptionsItemId.value = null
}

function requestRemoveBook(itemId: string) {
  pendingRemoveItemId.value = itemId
  closeBookOptions()
}

async function confirmRemoveBook() {
  if (!pendingRemoveItemId.value) {
    return
  }

  const itemId = pendingRemoveItemId.value

  try {
    await listDetailStore.removeItem(listId.value, itemId)
    pendingRemoveItemId.value = null
    toastStore.showSuccess('Livro removido da lista.')
  } catch {
    toastStore.showError(listDetailStore.errorMessage || 'Não foi possível remover o livro agora.')
  }
}

async function submitBookSearch() {
  hasSearchedBooks.value = searchForm.term.trim().length > 0
  showManualBookForm.value = false
  await listDetailStore.searchBooks(searchForm.term)
}

async function chooseExistingBook(bookId: string) {
  try {
    await listDetailStore.addExistingBook(listId.value, bookId)
    searchForm.term = ''
    hasSearchedBooks.value = false
    showManualBookForm.value = false
    isAddBookFlowOpen.value = false
    toastStore.showSuccess('Livro adicionado à lista.')
  } catch {
    toastStore.showError(listDetailStore.errorMessage || 'Não foi possível adicionar o livro agora.')
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
    searchForm.term = ''
    hasSearchedBooks.value = false
    showManualBookForm.value = false
    isAddBookFlowOpen.value = false
    toastStore.showSuccess('Livro adicionado à lista.')
  } catch {
    toastStore.showError(listDetailStore.errorMessage || 'Não foi possível adicionar o livro agora.')
  }
}

function showManualForm() {
  showManualBookForm.value = true
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
    closeBookOptions()
    toastStore.showSuccess('Ordem atualizada.')
  } catch {
    toastStore.showError(listDetailStore.errorMessage || 'Não foi possível mudar a ordem agora.')
  }
}

async function moveDown(itemId: string, currentPosition: number) {
  if (currentPosition >= listDetailStore.items.length) {
    return
  }

  try {
    await listDetailStore.reorderItem(listId.value, itemId, currentPosition + 1)
    closeBookOptions()
    toastStore.showSuccess('Ordem atualizada.')
  } catch {
    toastStore.showError(listDetailStore.errorMessage || 'Não foi possível mudar a ordem agora.')
  }
}

async function openMoveMenu(itemId: string) {
  closeBookOptions()
  activeMoveItemId.value = itemId
  await listDetailStore.fetchAvailableLists()
}

function closeMoveFlow() {
  activeMoveItemId.value = null
}

async function confirmMove(itemId: string) {
  const targetListId = moveTargets[itemId] ?? ''

  if (!targetListId) {
    listDetailStore.errorMessage = 'Escolha a lista para onde deseja enviar o livro.'
    toastStore.showWarning('Escolha a lista de destino.')
    return
  }

  try {
    await listDetailStore.moveItemToList(listId.value, itemId, targetListId, 1)
    closeMoveFlow()
    delete moveTargets[itemId]
    toastStore.showSuccess('Livro movido com sucesso.')
  } catch {
    toastStore.showError(listDetailStore.errorMessage || 'Não foi possível mover o livro agora.')
  }
}
</script>

<template>
  <AuthenticatedScaffold page-class="list-detail-page">
    <header class="app-page-header">
      <div class="app-page-header__title">
        <p class="app-page-kicker">Sophena</p>
        <h1 class="app-page-title">{{ pageTitle }}</h1>
        <p class="app-page-subtitle">
          Acompanhe a ordem dos livros e use ações simples para mover, remover ou adicionar outro título.
        </p>
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

    <IonCard class="app-card add-flow-card app-fade-in">
      <IonCardContent class="add-flow-content">
        <div class="add-flow-copy">
          <p class="hero-kicker">Adicionar livro</p>
          <h2>Escolha como quer adicionar</h2>
          <p>Escolher um livro já existente ou cadastrar um livro novo fica disponível em um passo guiado.</p>
        </div>

        <IonButton
          class="add-flow-button"
          data-testid="open-add-book-flow"
          @click="openAddBookFlow"
        >
          <span class="button-inline-content">
            <IonIcon :icon="addCircleOutline" aria-hidden="true" />
            Adicionar livro
          </span>
        </IonButton>
      </IonCardContent>
    </IonCard>

    <IonCard class="app-card items-card">
      <IonCardContent class="items-card-content">
        <div class="section-heading">
          <div>
            <h2>Livros da lista</h2>
            <p>{{ bookCountLabel }}</p>
          </div>
        </div>

        <p
          v-if="inlineErrorMessage"
          class="app-feedback app-feedback--error"
          role="status"
          aria-live="polite"
        >
          {{ inlineErrorMessage }}
        </p>

        <p
          v-if="listDetailStore.feedbackMessage"
          class="app-feedback app-feedback--success"
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
          <div class="loading-skeleton-list" aria-hidden="true">
            <div v-for="index in 3" :key="index" class="item-skeleton app-skeleton-card">
              <div class="item-skeleton-top">
                <div class="app-skeleton item-skeleton-position"></div>
                <div class="app-skeleton item-skeleton-cover"></div>
                <div class="item-skeleton-copy">
                  <div class="app-skeleton app-skeleton-text app-skeleton-text--medium"></div>
                  <div class="app-skeleton app-skeleton-text app-skeleton-text--long"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <EmptyStateCard
          v-else-if="showEmptyState"
          title="Esta lista ainda não tem livros."
          description="Quando você adicionar um livro, ele aparecerá aqui."
          action-label="Adicionar o primeiro livro"
          action-testid="empty-open-add-book"
          @action="openAddBookFlow"
        />

        <ol v-else class="items-list app-fade-in">
          <li
            v-for="item in listDetailStore.items"
            :key="item.book_list_item_id"
            class="item-card"
          >
            <BookCard
              :title="item.book.title"
              :author="item.book.author"
              :cover-url="item.book.cover_url"
              :position="item.position"
              :show-position="true"
            >
              <template #actions>
                <IonButton
                  fill="outline"
                  class="options-button"
                  :data-testid="`open-book-options-${item.book_list_item_id}`"
                  @click="openBookOptions(item.book_list_item_id)"
                >
                  <span class="button-inline-content">
                    <IonIcon :icon="ellipsisHorizontalOutline" aria-hidden="true" />
                    Opções
                  </span>
                </IonButton>
              </template>
            </BookCard>
          </li>
        </ol>
      </IonCardContent>
    </IonCard>

    <ResponsiveSheetModal
      v-model="isAddBookFlowOpen"
      title="Adicionar livro"
      description="Busque pelo título ou autor. Se o livro não aparecer, você poderá cadastrar um novo."
      panel-testid="add-book-flow"
      close-testid="close-add-book-flow"
    >
      <div class="flow-grid">
        <section class="flow-section app-fade-in">
          <h3>Primeiro, procure o livro</h3>
          <p>Digite uma parte do título ou do nome do autor.</p>

          <form data-testid="search-books-form" class="flow-form" @submit.prevent="submitBookSearch">
            <label class="app-field">
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
              class="flow-button"
              :disabled="listDetailStore.isSearching || listDetailStore.isAddingBook"
            >
              <span v-if="!listDetailStore.isSearching" class="button-inline-content">
                <IonIcon :icon="searchOutline" aria-hidden="true" />
                Buscar
              </span>
              <IonSpinner v-else name="crescent" />
            </IonButton>
          </form>

          <div v-if="canShowManualBookPath && !showManualBookForm" class="manual-path">
            <p class="secondary-feedback">
              Nenhum livro apareceu na busca.
            </p>
            <button
              type="button"
              class="manual-path-button"
              data-testid="show-manual-book-form"
              @click="showManualForm"
            >
              Cadastrar este livro
            </button>
          </div>

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

        <section v-if="showManualBookForm" class="flow-section app-fade-in">
          <h3>Cadastrar um livro novo</h3>
          <p>Preencha título e autor para adicionar o livro à lista.</p>

          <form data-testid="manual-book-form" class="flow-form" @submit.prevent="submitManualBook">
            <label class="app-field">
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

            <label class="app-field">
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

            <label class="app-field">
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

            <label class="app-field">
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
              class="flow-button"
              :disabled="listDetailStore.isAddingBook"
            >
              <span v-if="!listDetailStore.isAddingBook">Adicionar livro</span>
              <IonSpinner v-else name="crescent" />
            </IonButton>
          </form>
        </section>
      </div>
    </ResponsiveSheetModal>

    <ResponsiveSheetModal
      v-model="isOptionsFlowOpen"
      title="Opções do livro"
      description="Escolha o que deseja fazer com este livro."
      panel-testid="book-options-sheet"
      close-testid="close-book-options"
    >
      <div v-if="optionsItem" class="options-flow">
        <BookCard
          :title="optionsItem.book.title"
          :author="optionsItem.book.author"
          :cover-url="optionsItem.book.cover_url"
          :position="optionsItem.position"
          :show-position="true"
        />

        <div class="options-action-list">
          <IonButton
            fill="outline"
            class="sheet-action-button"
            :disabled="optionsItem.position === 1 || listDetailStore.reorderingItemId === optionsItem.book_list_item_id"
            :data-testid="`move-up-${optionsItem.book_list_item_id}`"
            @click="moveUp(optionsItem.book_list_item_id, optionsItem.position)"
          >
            <span class="button-inline-content">
              <IonIcon :icon="arrowUpOutline" aria-hidden="true" />
              Subir na lista
            </span>
          </IonButton>

          <IonButton
            fill="outline"
            class="sheet-action-button"
            :disabled="optionsItem.position === listDetailStore.items.length || listDetailStore.reorderingItemId === optionsItem.book_list_item_id"
            :data-testid="`move-down-${optionsItem.book_list_item_id}`"
            @click="moveDown(optionsItem.book_list_item_id, optionsItem.position)"
          >
            <span class="button-inline-content">
              <IonIcon :icon="arrowDownOutline" aria-hidden="true" />
              Descer na lista
            </span>
          </IonButton>

          <IonButton
            fill="outline"
            class="sheet-action-button"
            :data-testid="`open-move-${optionsItem.book_list_item_id}`"
            :disabled="listDetailStore.movingItemId === optionsItem.book_list_item_id || listDetailStore.isLoadingLists"
            @click="openMoveMenu(optionsItem.book_list_item_id)"
          >
            <span class="button-inline-content">
              <IonIcon :icon="swapHorizontalOutline" aria-hidden="true" />
              Mover para outra lista
            </span>
          </IonButton>
        </div>

        <IonButton
          fill="outline"
          color="danger"
          class="sheet-action-button sheet-action-button--danger"
          :disabled="listDetailStore.removingItemId === optionsItem.book_list_item_id"
          :data-testid="`request-remove-${optionsItem.book_list_item_id}`"
          @click="requestRemoveBook(optionsItem.book_list_item_id)"
        >
          <span class="button-inline-content">
            <IonIcon :icon="trashOutline" aria-hidden="true" />
            Remover da lista
          </span>
        </IonButton>
      </div>
    </ResponsiveSheetModal>

    <AppConfirmSheet
      v-model="isRemoveConfirmOpen"
      title="Remover livro da lista?"
      message="O livro sairá desta lista, mas continuará cadastrado no Sophena."
      confirm-label="Remover livro"
      cancel-label="Manter na lista"
      tone="danger"
      panel-testid="remove-book-confirm-sheet"
      @confirm="confirmRemoveBook"
    />

    <ResponsiveSheetModal
      v-model="isMoveFlowOpen"
      title="Enviar livro para outra lista"
      description="Escolha a lista de destino para enviar este livro."
      panel-testid="move-book-flow"
      close-testid="close-move-book-flow"
    >
      <div v-if="movingItem" class="move-flow">
        <BookCard
          :title="movingItem.book.title"
          :author="movingItem.book.author"
          :cover-url="movingItem.book.cover_url"
          :position="movingItem.position"
          :show-position="true"
        />

        <label class="app-field">
          <span>Enviar para</span>
          <select
            :name="`target-list-${movingItem.book_list_item_id}`"
            v-model="moveTargets[movingItem.book_list_item_id]"
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
          class="flow-button"
          :data-testid="`confirm-move-${movingItem.book_list_item_id}`"
          :disabled="listDetailStore.movingItemId === movingItem.book_list_item_id"
          @click="confirmMove(movingItem.book_list_item_id)"
        >
          Confirmar envio
        </IonButton>
      </div>
    </ResponsiveSheetModal>
  </AuthenticatedScaffold>
</template>

<style scoped>
.back-button {
  --color: var(--color-primary);
  --border-color: var(--color-primary);
  --border-radius: var(--radius-lg);
}

.add-flow-content {
  display: grid;
  gap: var(--space-md);
}

.add-flow-copy {
  display: grid;
  gap: var(--space-xs);
}

.hero-kicker {
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.add-flow-copy h2,
.section-heading h2 {
  color: var(--color-heading);
  font-size: 22px;
  font-weight: 600;
}

.add-flow-copy p,
.section-heading p {
  color: var(--color-muted);
}

.add-flow-button,
.flow-button {
  --background: var(--color-primary);
  --background-hover: var(--color-primary-hover);
  --border-radius: var(--radius-lg);
  --box-shadow: var(--shadow-md);
  min-height: 3.2rem;
  font-weight: 700;
}

.button-inline-content {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
}

.items-card-content,
.flow-grid,
.flow-section,
.flow-form,
.move-flow,
.options-flow,
.options-action-list,
.manual-path {
  display: grid;
  gap: var(--space-md);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  align-items: center;
}

.loading-state {
  display: grid;
  justify-items: start;
  gap: var(--space-sm);
  color: var(--color-muted);
}

.loading-skeleton-list {
  width: min(100%, 36rem);
  display: grid;
  gap: var(--space-sm);
}

.item-skeleton {
  gap: var(--space-md);
}

.item-skeleton-top {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: var(--space-md);
  align-items: center;
}

.item-skeleton-position {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
}

.item-skeleton-cover {
  width: 4.85rem;
  height: 7rem;
  border-radius: var(--radius-sm);
}

.item-skeleton-copy {
  display: grid;
  gap: var(--space-sm);
}

.items-list {
  display: grid;
  gap: var(--space-sm);
  list-style: none;
  margin: 0;
  padding: 0;
}

.item-card {
  display: grid;
}

.options-button,
.sheet-action-button {
  --border-radius: var(--radius-lg);
  font-weight: 700;
}

.sheet-action-button {
  min-height: 3rem;
}

.sheet-action-button--danger {
  margin-top: var(--space-xs);
}

.manual-path {
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px dashed rgba(53, 95, 74, 0.32);
  border-radius: var(--radius-md);
  background: rgba(230, 239, 233, 0.36);
}

.manual-path-button {
  min-height: 3rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-weight: 700;
}

.flow-section {
  padding: var(--space-md);
  border: 1px solid rgba(226, 224, 219, 0.96);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
}

.flow-section h3 {
  color: var(--color-heading);
  font-size: 22px;
  font-weight: 600;
}

.flow-section p,
.secondary-feedback {
  color: var(--color-muted);
}

.search-results {
  display: grid;
  gap: var(--space-sm);
  list-style: none;
  padding: 0;
}

.search-result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid rgba(226, 224, 219, 0.96);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-sm);
}

.search-result-content {
  display: grid;
  gap: var(--space-xs);
  color: var(--color-heading);
}

.search-result-content span {
  color: var(--color-muted);
}

.pick-button {
  --border-radius: var(--radius-lg);
  font-weight: 700;
}

@media (min-width: 768px) {
  .add-flow-content {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .flow-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
    align-items: start;
  }
}

@media (max-width: 640px) {
  .search-result-item {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
