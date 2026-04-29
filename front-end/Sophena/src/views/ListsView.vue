<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { IonButton, IonCard, IonCardContent, IonIcon, IonSpinner } from '@ionic/vue'
import { createOutline, ellipsisHorizontalOutline, trashOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'

import EmptyStateCard from '@/components/feedback/EmptyStateCard.vue'
import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
import AppConfirmSheet from '@/components/overlay/AppConfirmSheet.vue'
import ResponsiveSheetModal from '@/components/overlay/ResponsiveSheetModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useListsStore } from '@/stores/lists'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const authStore = useAuthStore()
const listsStore = useListsStore()
const toastStore = useToastStore()
const listNameInput = ref<HTMLInputElement | null>(null)
const activeOptionsListId = ref<string | null>(null)
const editingListId = ref<string | null>(null)
const pendingDeleteListId = ref<string | null>(null)

const form = reactive({
  name: '',
})
const editForm = reactive({
  name: '',
})

const greeting = computed(() => {
  if (!authStore.user) {
    return 'Suas listas'
  }

  return `Olá, ${authStore.user.user_name}`
})

const showEmptyState = computed(() => {
  return !listsStore.isLoading && listsStore.items.length === 0 && !listsStore.errorMessage
})
const optionsList = computed(() => {
  if (!activeOptionsListId.value) {
    return null
  }

  return listsStore.items.find((list) => list.id === activeOptionsListId.value) ?? null
})
const editingList = computed(() => {
  if (!editingListId.value) {
    return null
  }

  return listsStore.items.find((list) => list.id === editingListId.value) ?? null
})
const isListOptionsOpen = computed({
  get: () => Boolean(activeOptionsListId.value),
  set: (value: boolean) => {
    if (!value) {
      activeOptionsListId.value = null
    }
  },
})
const isEditListOpen = computed({
  get: () => Boolean(editingListId.value),
  set: (value: boolean) => {
    if (!value) {
      editingListId.value = null
      editForm.name = ''
    }
  },
})
const isDeleteConfirmOpen = computed({
  get: () => Boolean(pendingDeleteListId.value),
  set: (value: boolean) => {
    if (!value) {
      pendingDeleteListId.value = null
    }
  },
})

onMounted(async () => {
  await listsStore.fetchLists()
})

async function submitCreateList() {
  try {
    await listsStore.createList(form.name.trim())
    form.name = ''
    toastStore.showSuccess('Lista criada.')
  } catch {
    toastStore.showError(listsStore.errorMessage || 'Não foi possível criar a lista agora.')
  }
}

async function openList(listId: string) {
  await router.push({
    name: 'list-detail',
    params: {
      listId,
    },
  })
}

function openListOptions(listId: string) {
  activeOptionsListId.value = listId
}

function requestRenameList(listId: string) {
  const list = listsStore.items.find((item) => item.id === listId)

  if (!list) {
    return
  }

  activeOptionsListId.value = null
  editingListId.value = listId
  editForm.name = list.name
}

function requestDeleteList(listId: string) {
  activeOptionsListId.value = null
  pendingDeleteListId.value = listId
}

async function submitEditList() {
  if (!editingListId.value) {
    return
  }

  try {
    await listsStore.updateListName(editingListId.value, editForm.name.trim())
    editingListId.value = null
    editForm.name = ''
    toastStore.showSuccess('Lista atualizada.')
  } catch {
    toastStore.showError(listsStore.errorMessage || 'Não foi possível atualizar a lista agora.')
  }
}

async function confirmDeleteList() {
  if (!pendingDeleteListId.value) {
    return
  }

  try {
    await listsStore.deleteList(pendingDeleteListId.value)
    pendingDeleteListId.value = null
    toastStore.showSuccess('Lista apagada.')
  } catch {
    toastStore.showError(listsStore.errorMessage || 'Não foi possível apagar a lista agora.')
  }
}

async function focusCreateList() {
  await nextTick()
  listNameInput.value?.focus()
}
</script>

<template>
  <AuthenticatedScaffold page-class="lists-page">
    <header class="app-page-header">
      <div class="app-page-header__title">
        <p class="app-page-kicker">Sophena</p>
        <h1 class="app-page-title">{{ greeting }}</h1>
        <p class="app-page-subtitle">
          Organize suas listas em poucos toques. Crie uma nova e continue de onde parou.
        </p>
      </div>
    </header>

    <IonCard class="app-card hero-card app-fade-in">
      <IonCardContent class="hero-card-content">
        <div class="hero-copy">
          <p class="hero-kicker">Começar</p>
          <h2>Criar uma nova lista</h2>
          <p>Dê um nome simples para encontrar seus livros com facilidade depois.</p>
        </div>

        <form class="create-list-form" @submit.prevent="submitCreateList">
          <label class="app-field">
            <span>Nova lista</span>
            <input
              ref="listNameInput"
              name="list-name"
              type="text"
              autocomplete="off"
              placeholder="Exemplo: Quero ler"
              :disabled="listsStore.isCreating"
              v-model="form.name"
            />
          </label>

          <IonButton type="submit" class="create-button" :disabled="listsStore.isCreating">
            <span v-if="!listsStore.isCreating">Criar lista</span>
            <IonSpinner v-else name="crescent" />
          </IonButton>
        </form>
      </IonCardContent>
    </IonCard>

    <p
      v-if="listsStore.errorMessage"
      class="app-feedback app-feedback--error"
      role="status"
      aria-live="polite"
    >
      {{ listsStore.errorMessage }}
    </p>

    <section class="lists-section">
      <div class="section-heading">
        <h2>Suas listas</h2>
        <span class="section-count">{{ listsStore.items.length }}</span>
      </div>

      <div v-if="listsStore.isLoading" class="loading-state" role="status" aria-live="polite">
        <IonSpinner name="crescent" />
        <span>Carregando suas listas...</span>
        <div class="loading-skeleton-list" data-testid="lists-loading-skeleton" aria-hidden="true">
          <div v-for="index in 3" :key="index" class="app-skeleton-card" data-testid="skeleton-block">
            <div class="app-skeleton app-skeleton-text app-skeleton-text--medium"></div>
            <div class="app-skeleton app-skeleton-text app-skeleton-text--long"></div>
          </div>
        </div>
      </div>

      <EmptyStateCard
        v-else-if="showEmptyState"
        title="Você ainda não criou nenhuma lista."
        description="Crie sua primeira lista para começar."
        action-label="Criar minha primeira lista"
        action-testid="empty-create-list"
        @action="focusCreateList"
      />

      <ul v-else class="lists-grid app-fade-in">
        <li v-for="list in listsStore.items" :key="list.id">
          <div class="list-card">
            <button
              type="button"
              class="list-link app-interactive"
              :data-testid="`list-link-${list.id}`"
              @click="openList(list.id)"
            >
              <span class="list-link-copy">
                <strong>{{ list.name }}</strong>
                <small>Toque para abrir e organizar seus livros</small>
              </span>
              <span class="list-link-action">Abrir</span>
            </button>

            <IonButton
              fill="clear"
              class="list-options-button"
              :data-testid="`open-list-options-${list.id}`"
              :aria-label="`Editar lista ${list.name}`"
              :title="`Editar lista ${list.name}`"
              @click="openListOptions(list.id)"
            >
              <IonIcon :icon="ellipsisHorizontalOutline" aria-hidden="true" />
            </IonButton>
          </div>
        </li>
      </ul>
    </section>

    <ResponsiveSheetModal
      v-model="isListOptionsOpen"
      title="Editar lista"
      description="Escolha o que deseja fazer com esta lista."
      panel-testid="list-options-sheet"
      close-testid="close-list-options"
    >
      <div v-if="optionsList" class="list-options">
        <div class="list-options-summary">
          <strong>{{ optionsList.name }}</strong>
        </div>

        <IonButton
          fill="outline"
          class="list-menu-button"
          :data-testid="`request-rename-list-${optionsList.id}`"
          @click="requestRenameList(optionsList.id)"
        >
          <span class="button-inline-content">
            <IonIcon :icon="createOutline" aria-hidden="true" />
            Editar nome
          </span>
        </IonButton>

        <IonButton
          fill="outline"
          color="danger"
          class="list-menu-button"
          :disabled="listsStore.isDeleting"
          :data-testid="`request-delete-list-${optionsList.id}`"
          @click="requestDeleteList(optionsList.id)"
        >
          <span class="button-inline-content">
            <IonIcon :icon="trashOutline" aria-hidden="true" />
            Apagar lista
          </span>
        </IonButton>
      </div>
    </ResponsiveSheetModal>

    <ResponsiveSheetModal
      v-model="isEditListOpen"
      title="Editar nome"
      description="Escolha um nome simples para encontrar a lista depois."
      panel-testid="edit-list-sheet"
      close-testid="close-edit-list"
    >
      <form
        v-if="editingList"
        class="edit-list-form"
        data-testid="edit-list-form"
        @submit.prevent="submitEditList"
      >
        <label class="app-field">
          <span>Nome da lista</span>
          <input
            name="edit-list-name"
            type="text"
            autocomplete="off"
            placeholder="Exemplo: Lidos este ano"
            :disabled="listsStore.isUpdating"
            v-model="editForm.name"
          />
        </label>

        <IonButton type="submit" class="save-edit-button" :disabled="listsStore.isUpdating">
          <span v-if="!listsStore.isUpdating">Salvar nome</span>
          <IonSpinner v-else name="crescent" />
        </IonButton>
      </form>
    </ResponsiveSheetModal>

    <AppConfirmSheet
      v-model="isDeleteConfirmOpen"
      title="Apagar lista?"
      message="Todos os livros serão removidos desta lista, mas continuarão cadastrados no Sophena."
      confirm-label="Apagar lista"
      cancel-label="Cancelar"
      tone="danger"
      panel-testid="delete-list-confirm-sheet"
      @confirm="confirmDeleteList"
    />
  </AuthenticatedScaffold>
</template>

<style scoped>
.hero-card-content {
  display: grid;
  gap: var(--space-md);
}

.hero-copy {
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

.hero-copy h2,
.section-heading h2 {
  color: var(--color-heading);
  font-size: 22px;
  font-weight: 600;
}

.hero-copy p {
  color: var(--color-muted);
}

.create-list-form {
  display: grid;
  gap: var(--space-sm);
}

.create-button {
  --background: var(--color-primary);
  --background-hover: var(--color-primary-hover);
  --border-radius: var(--radius-lg);
  --box-shadow: var(--shadow-md);
  min-height: 3.2rem;
  font-weight: 700;
}

.lists-section {
  display: grid;
  gap: var(--space-md);
}

.section-heading {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.section-count {
  min-width: 2rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
  text-align: center;
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

.lists-grid {
  display: grid;
  gap: var(--space-sm);
  list-style: none;
  padding: 0;
}

.list-card {
  width: 100%;
  display: flex;
  gap: var(--space-md);
  align-items: center;
  border: 1px solid rgba(226, 224, 219, 0.96);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-sm);
}

.list-card:hover {
  transform: translateY(-1px);
  border-color: rgba(53, 95, 74, 0.24);
  box-shadow: var(--shadow-md);
}

.list-link {
  min-width: 0;
  flex: 1;
  display: flex;
  gap: var(--space-md);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  border: 0;
  background: transparent;
  color: var(--color-heading);
  text-align: left;
}

.list-options-button {
  --color: var(--color-primary);
  --border-radius: var(--radius-md);
  width: 3rem;
  min-width: 3rem;
  min-height: 3rem;
  margin-right: var(--space-xs);
}

.list-link:focus-visible,
.list-options-button:focus-visible {
  outline: 3px solid rgba(53, 95, 74, 0.2);
  outline-offset: 2px;
}

.list-link-copy {
  display: grid;
  gap: var(--space-xs);
}

.list-link-copy strong {
  font-size: 1rem;
  font-weight: 700;
}

.list-link-copy small {
  color: var(--color-muted);
}

.list-link-action {
  color: var(--color-primary);
  font-weight: 700;
}

.list-options,
.edit-list-form {
  display: grid;
  gap: var(--space-sm);
}

.list-options-summary {
  padding: var(--space-sm) 0;
  color: var(--color-heading);
}

.list-menu-button,
.save-edit-button {
  --border-radius: var(--radius-lg);
  min-height: 3.15rem;
  font-weight: 700;
}

.save-edit-button {
  --background: var(--color-primary);
  --background-hover: var(--color-primary-hover);
  --box-shadow: var(--shadow-md);
}

.button-inline-content {
  display: inline-flex;
  gap: var(--space-xs);
  align-items: center;
  justify-content: center;
}

@media (min-width: 768px) {
  .hero-card-content {
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 22rem);
    align-items: end;
  }
}

@media (max-width: 640px) {
  .list-card,
  .list-link {
    align-items: flex-start;
  }

  .list-link-action {
    padding-top: 0.15rem;
  }
}
</style>
