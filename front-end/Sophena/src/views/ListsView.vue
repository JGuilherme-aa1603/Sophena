<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { IonIcon, IonSpinner } from '@ionic/vue'
import { createOutline, trashOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'

import EmptyStateCard from '@/components/feedback/EmptyStateCard.vue'
import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
import SophenaWordmark from '@/components/SophenaWordmark.vue'
import AppConfirmSheet from '@/components/overlay/AppConfirmSheet.vue'
import ResponsiveSheetModal from '@/components/overlay/ResponsiveSheetModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useListsStore } from '@/stores/lists'
import { useThemePreferencesStore } from '@/stores/theme-preferences'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const authStore = useAuthStore()
const listsStore = useListsStore()
const themePrefs = useThemePreferencesStore()
const toastStore = useToastStore()

const isDark = computed(() => themePrefs.appearance === 'dark')
const gradientBottom = computed(() => isDark.value ? 'rgba(19,17,12,0)' : 'rgba(251,246,236,0)')

const activeOptionsListId = ref<string | null>(null)
const editingListId = ref<string | null>(null)
const pendingDeleteListId = ref<string | null>(null)
const isCreateOpen = ref(false)
const loadErrorMessage = ref(listsStore.errorMessage)

const form = reactive({
  name: '',
  icon: 'bookmark',
  tint_index: 0,
})
const editForm = reactive({ name: '' })

// ─── list tints (earth tones) ─────────────────────
const LIST_TINTS = [
  { bg: 'rgba(205,225,208,0.78)', fg: '#2d5240', darkBg: 'rgba(40,72,55,0.48)',  darkFg: '#a0c4b0' },
  { bg: 'rgba(235,216,190,0.85)', fg: '#7c5e3e', darkBg: 'rgba(72,55,30,0.48)',  darkFg: '#c8a870' },
  { bg: 'rgba(238,205,200,0.80)', fg: '#7a3a4a', darkBg: 'rgba(72,35,45,0.48)',  darkFg: '#c890a0' },
  { bg: 'rgba(205,215,235,0.80)', fg: '#2c4a5e', darkBg: 'rgba(35,52,70,0.48)',  darkFg: '#88aec8' },
  { bg: 'rgba(215,205,238,0.80)', fg: '#5b4a82', darkBg: 'rgba(55,38,75,0.48)',  darkFg: '#b0a0d0' },
  { bg: 'rgba(230,210,185,0.88)', fg: '#5a4528', darkBg: 'rgba(65,50,28,0.48)',  darkFg: '#c0a060' },
]

const LIST_ICONS = [
  'bookmark', 'heart', 'star', 'feather', 'coffee',
  'moon', 'leaf', 'flame', 'flag', 'archive',
] as const
type ListIconId = (typeof LIST_ICONS)[number]

// Warm book spine colors generated from title+author hash
const SPINE_COLORS = [
  '#7a5c3e', '#4a6a52', '#5c4a7a', '#7a4a4a',
  '#4a5c7a', '#6a7a4a', '#7a6a4a', '#4a6a7a',
]

function hashBookColor(title: string, author: string): string {
  let h = 0
  const s = title + author
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return SPINE_COLORS[h % SPINE_COLORS.length]!
}

function listTint(index: number | undefined | null) {
  const i = typeof index === 'number' && Number.isFinite(index) ? index : 0
  const t = LIST_TINTS[((i % LIST_TINTS.length) + LIST_TINTS.length) % LIST_TINTS.length]!
  return isDark.value ? { bg: t.darkBg, fg: t.darkFg } : { bg: t.bg, fg: t.fg }
}

const userName = computed(() => authStore.user?.user_name ?? '')
const greeting = computed(() => userName.value ? userName.value : 'Suas listas')

const showEmptyState = computed(() =>
  !listsStore.isLoading && listsStore.items.length === 0 && !loadErrorMessage.value,
)
const optionsList = computed(() =>
  activeOptionsListId.value
    ? listsStore.items.find((l) => l.id === activeOptionsListId.value) ?? null
    : null,
)
const editingList = computed(() =>
  editingListId.value
    ? listsStore.items.find((l) => l.id === editingListId.value) ?? null
    : null,
)

const isListOptionsOpen = computed({
  get: () => Boolean(activeOptionsListId.value),
  set: (v: boolean) => { if (!v) activeOptionsListId.value = null },
})
const isEditListOpen = computed({
  get: () => Boolean(editingListId.value),
  set: (v: boolean) => { if (!v) { editingListId.value = null; editForm.name = '' } },
})
const isDeleteConfirmOpen = computed({
  get: () => Boolean(pendingDeleteListId.value),
  set: (v: boolean) => { if (!v) pendingDeleteListId.value = null },
})

onMounted(async () => {
  await listsStore.fetchLists()
  loadErrorMessage.value = listsStore.errorMessage
})

function openCreate() {
  form.name = ''
  form.icon = 'bookmark'
  form.tint_index = 0
  isCreateOpen.value = true
}

async function submitCreateList() {
  try {
    await listsStore.createList(form.name.trim(), form.icon, form.tint_index)
    isCreateOpen.value = false
    form.name = ''
    toastStore.showSuccess('Estante criada.')
  } catch {
    toastStore.showError(listsStore.errorMessage || 'Não foi possível criar a lista agora.')
  }
}

async function openList(listId: string) {
  await router.push({ name: 'list-detail', params: { listId } })
}

function openListOptions(listId: string) {
  activeOptionsListId.value = listId
}

function requestRenameList(listId: string) {
  const list = listsStore.items.find((item) => item.id === listId)
  if (!list) return
  activeOptionsListId.value = null
  editingListId.value = listId
  editForm.name = list.name
}

function requestDeleteList(listId: string) {
  activeOptionsListId.value = null
  pendingDeleteListId.value = listId
}

async function submitEditList() {
  if (!editingListId.value) return
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
  if (!pendingDeleteListId.value) return
  try {
    await listsStore.deleteList(pendingDeleteListId.value)
    pendingDeleteListId.value = null
    toastStore.showSuccess('Lista apagada.')
  } catch {
    toastStore.showError(listsStore.errorMessage || 'Não foi possível apagar a lista agora.')
  }
}
</script>

<template>
  <AuthenticatedScaffold page-class="lists-page">
    <!-- Header -->
    <header class="lists-header">
      <SophenaWordmark :size="28" />
      <div class="lists-header-right">
        <span
          class="lists-count-badge"
          :title="`${listsStore.items.length} estante(s)`"
          aria-label="`${listsStore.items.length} estante(s)`"
        >
          {{ listsStore.items.length }}
        </span>
      </div>
    </header>

    <div class="lists-hero">
      <p class="app-page-kicker">Sua biblioteca · {{ listsStore.items.length }} estante(s)</p>
      <h1 class="app-page-title">
        Boa tarde,<br>
        <em>{{ greeting }}.</em>
      </h1>
    </div>

    <p
      v-if="loadErrorMessage"
      class="app-feedback app-feedback--error"
      role="status"
      aria-live="polite"
    >
      {{ loadErrorMessage }}
    </p>

    <!-- Loading skeletons -->
    <div v-if="listsStore.isLoading" class="loading-state" role="status" aria-live="polite">
      <div class="loading-skeleton-list" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="shelf-skeleton">
          <div class="shelf-skeleton-header app-skeleton"></div>
          <div class="shelf-skeleton-body app-skeleton-card">
            <div class="app-skeleton app-skeleton-text app-skeleton-text--medium"></div>
            <div class="app-skeleton app-skeleton-text app-skeleton-text--short"></div>
          </div>
        </div>
      </div>
    </div>

    <EmptyStateCard
      v-else-if="showEmptyState"
      title="Você ainda não criou nenhuma estante."
      description="Crie sua primeira estante e comece a organizar seus livros."
      action-label="Criar minha primeira estante"
      action-testid="empty-create-list"
      @action="openCreate"
    />

    <!-- List cards (shelf style) -->
    <ul v-else class="lists-grid app-fade-in">
      <li v-for="list in listsStore.items" :key="list.id">
        <div class="shelf-card" :data-testid="`list-card-${list.id}`">
          <!-- Shelf preview area -->
          <button
            type="button"
            class="shelf-preview"
            :style="{ background: `linear-gradient(180deg, ${listTint(list.tint_index).bg} 0%, ${gradientBottom} 100%)` }"
            :aria-label="`Abrir lista ${list.name}`"
            :data-testid="`list-link-${list.id}`"
            @click="openList(list.id)"
          >
            <div class="shelf-books">
              <div
                v-for="(book, j) in list.preview_items.slice(0, 5)"
                :key="book.id"
                class="shelf-book"
              >
                <img
                  v-if="book.cover_url"
                  :src="book.cover_url"
                  :alt="book.title"
                  class="shelf-book-cover"
                >
                <div
                  v-else
                  class="shelf-book-spine"
                  :style="{ background: hashBookColor(book.title, book.author) }"
                >
                  <span class="shelf-book-author">{{ book.author.slice(0, 12) }}</span>
                  <span class="shelf-book-title">{{ book.title.slice(0, 18) }}</span>
                </div>
              </div>
              <div
                v-if="list.preview_items.length === 0"
                class="shelf-book-empty"
              >
                <span>vazio</span>
              </div>
            </div>
            <div class="shelf-edge"></div>
          </button>

          <!-- Card footer -->
          <div class="shelf-footer">
            <div class="shelf-footer-left">
              <!-- Icon badge -->
              <span
                class="shelf-icon-badge"
                :style="{
                  background: listTint(list.tint_index).bg,
                  color: listTint(list.tint_index).fg,
                }"
              >
                <!-- bookmark -->
                <svg v-if="list.icon === 'bookmark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>
                <!-- heart -->
                <svg v-else-if="list.icon === 'heart'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7 2 0 3.5 1 4.5 2.5C13 6 14.5 5 16.5 5 20 5 22.5 8.5 21 12c-2 4.5-9 9-9 9z"/></svg>
                <!-- star -->
                <svg v-else-if="list.icon === 'star'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 6 6.3.6-4.8 4.3 1.5 6.1L12 17l-5.7 3 1.5-6.1L3 9.6 9.3 9z"/></svg>
                <!-- feather -->
                <svg v-else-if="list.icon === 'feather'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 4c-6 0-12 4-13 12-1 4 1 4 1 4s2-2 4-2c8 0 12-6 12-12zM4 20l5-5"/></svg>
                <!-- coffee -->
                <svg v-else-if="list.icon === 'coffee'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM16 9h2a2 2 0 0 1 0 4h-2M5 3v2M9 3v2M13 3v2"/></svg>
                <!-- moon -->
                <svg v-else-if="list.icon === 'moon'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>
                <!-- leaf -->
                <svg v-else-if="list.icon === 'leaf'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 21c-5-3-7-8-6-13 5-1 10 1 13 6-1 4-3 6-7 7zM5 19l8-8"/></svg>
                <!-- flame -->
                <svg v-else-if="list.icon === 'flame'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c4 0 7-3 7-7 0-4-4-6-4-10-3 0-7 4-7 9 0 4 1 8 4 8z"/></svg>
                <!-- flag -->
                <svg v-else-if="list.icon === 'flag'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></svg>
                <!-- archive -->
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18v4H3zM5 9v11h14V9M9 13h6"/></svg>
              </span>

              <div class="shelf-info">
                <span class="shelf-name">{{ list.name }}</span>
                <span class="shelf-meta">
                  {{ list.preview_items.length === 1 ? '1 livro' : `${list.preview_items.length} livros` }}
                </span>
              </div>
            </div>

            <button
              type="button"
              class="shelf-options-btn"
              :aria-label="`Opções de ${list.name}`"
              :data-testid="`open-list-options-${list.id}`"
              @click.stop="openListOptions(list.id)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- Nova estante button -->
    <button
      v-if="!listsStore.isLoading"
      type="button"
      class="create-shelf-btn"
      data-testid="open-create-list"
      @click="openCreate"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Nova estante
    </button>

    <!-- Create list sheet -->
    <ResponsiveSheetModal
      v-model="isCreateOpen"
      title="Nova estante"
      description="Escolha um nome, ícone e cor para ela."
      panel-testid="create-list-sheet"
      close-testid="close-create-list"
    >
      <form class="create-form" data-testid="create-list-form" @submit.prevent="submitCreateList">
        <label class="app-field">
          <span>Nome</span>
          <input
            name="list-name"
            type="text"
            autocomplete="off"
            placeholder="Ex: Para ler em 2026"
            :disabled="listsStore.isCreating"
            v-model="form.name"
          />
        </label>

        <!-- Icon picker -->
        <div class="picker-section">
          <span class="picker-label">Ícone</span>
          <div class="icon-grid">
            <button
              v-for="iconId in LIST_ICONS"
              :key="iconId"
              type="button"
              class="icon-btn"
              :class="{ 'icon-btn--active': form.icon === iconId }"
              :style="form.icon === iconId ? {
                background: listTint(form.tint_index).bg,
                color: listTint(form.tint_index).fg,
                borderColor: listTint(form.tint_index).fg,
              } : {}"
              :aria-label="iconId"
              @click="form.icon = iconId"
            >
              <!-- bookmark -->
              <svg v-if="iconId === 'bookmark'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>
              <svg v-else-if="iconId === 'heart'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7 2 0 3.5 1 4.5 2.5C13 6 14.5 5 16.5 5 20 5 22.5 8.5 21 12c-2 4.5-9 9-9 9z"/></svg>
              <svg v-else-if="iconId === 'star'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 6 6.3.6-4.8 4.3 1.5 6.1L12 17l-5.7 3 1.5-6.1L3 9.6 9.3 9z"/></svg>
              <svg v-else-if="iconId === 'feather'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 4c-6 0-12 4-13 12-1 4 1 4 1 4s2-2 4-2c8 0 12-6 12-12zM4 20l5-5"/></svg>
              <svg v-else-if="iconId === 'coffee'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM16 9h2a2 2 0 0 1 0 4h-2M5 3v2M9 3v2M13 3v2"/></svg>
              <svg v-else-if="iconId === 'moon'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>
              <svg v-else-if="iconId === 'leaf'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 21c-5-3-7-8-6-13 5-1 10 1 13 6-1 4-3 6-7 7zM5 19l8-8"/></svg>
              <svg v-else-if="iconId === 'flame'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c4 0 7-3 7-7 0-4-4-6-4-10-3 0-7 4-7 9 0 4 1 8 4 8z"/></svg>
              <svg v-else-if="iconId === 'flag'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18v4H3zM5 9v11h14V9M9 13h6"/></svg>
            </button>
          </div>
        </div>

        <!-- Tint picker -->
        <div class="picker-section">
          <span class="picker-label">Cor</span>
          <div class="tint-grid">
            <button
              v-for="(tint, i) in LIST_TINTS"
              :key="i"
              type="button"
              class="tint-btn"
              :class="{ 'tint-btn--active': form.tint_index === i }"
              :style="{ background: tint.bg, borderColor: form.tint_index === i ? tint.fg : 'transparent' }"
              :aria-label="`Cor ${i + 1}`"
              @click="form.tint_index = i"
            >
              <svg v-if="form.tint_index === i" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" :style="{ color: tint.fg }"><path d="M20 6L9 17l-5-5"/></svg>
            </button>
          </div>
        </div>

        <div class="create-form-actions">
          <button type="button" class="app-secondary-button" @click="isCreateOpen = false">
            Cancelar
          </button>
          <button type="submit" class="app-primary-button" :disabled="listsStore.isCreating">
            <IonSpinner v-if="listsStore.isCreating" name="crescent" style="--color: #fff; width: 18px; height: 18px;" />
            <span v-else>Criar estante</span>
          </button>
        </div>
      </form>
    </ResponsiveSheetModal>

    <!-- List options sheet -->
    <ResponsiveSheetModal
      v-model="isListOptionsOpen"
      title="Opções"
      description="O que você quer fazer com essa estante?"
      panel-testid="list-options-sheet"
      close-testid="close-list-options"
    >
      <div v-if="optionsList" class="list-options">
        <div class="list-options-name">{{ optionsList.name }}</div>

        <button
          type="button"
          class="list-menu-btn"
          :data-testid="`request-rename-list-${optionsList.id}`"
          @click="requestRenameList(optionsList.id)"
        >
          <IonIcon :icon="createOutline" aria-hidden="true" />
          Editar nome
        </button>

        <button
          type="button"
          class="list-menu-btn list-menu-btn--danger"
          :disabled="listsStore.isDeleting"
          :data-testid="`request-delete-list-${optionsList.id}`"
          @click="requestDeleteList(optionsList.id)"
        >
          <IonIcon :icon="trashOutline" aria-hidden="true" />
          Apagar estante
        </button>
      </div>
    </ResponsiveSheetModal>

    <!-- Edit name sheet -->
    <ResponsiveSheetModal
      v-model="isEditListOpen"
      title="Editar nome"
      description="Escolha um nome simples para encontrar a lista depois."
      panel-testid="edit-list-sheet"
      close-testid="close-edit-list"
    >
      <form
        v-if="editingList"
        class="edit-form"
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

        <button type="submit" class="app-primary-button" :disabled="listsStore.isUpdating">
          <IonSpinner v-if="listsStore.isUpdating" name="crescent" style="--color: #fff; width: 18px; height: 18px;" />
          <span v-else>Salvar nome</span>
        </button>
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
/* ─── Header ─────────────────────────────────────── */
.lists-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.lists-count-badge {
  min-width: 2rem;
  min-height: 2rem;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  display: inline-grid;
  place-items: center;
}

.lists-hero {
  margin-bottom: var(--space-lg);
  display: grid;
  gap: var(--space-sm);
}

/* ─── Loading ─────────────────────────────────────── */
.loading-state {
  display: grid;
  gap: var(--space-md);
}

.loading-skeleton-list {
  display: grid;
  gap: var(--space-md);
}

.shelf-skeleton {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
}

.shelf-skeleton-header {
  height: 120px;
  border-radius: 0;
}

.shelf-skeleton-body {
  border-radius: 0;
}

/* ─── Grid ────────────────────────────────────────── */
.lists-grid {
  display: grid;
  gap: var(--space-md);
  list-style: none;
  padding: 0;
}

/* ─── Shelf card ─────────────────────────────────── */
.shelf-card {
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition:
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.shelf-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

/* Shelf preview (top section with book spines) */
.shelf-preview {
  display: block;
  width: 100%;
  height: 130px;
  position: relative;
  border: none;
  cursor: pointer;
  overflow: hidden;
  padding: 0;
}

.shelf-books {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 8px;
  display: flex;
  gap: 6px;
  align-items: flex-end;
}

.shelf-book {
  width: 56px;
  height: 84px;
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(74, 53, 21, 0.2);
}

.shelf-book-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.shelf-book-spine {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 5px 5px 5px 8px;
  color: rgba(255, 255, 255, 0.9);
  position: relative;
}

.shelf-book-spine::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.06));
}

.shelf-book-author {
  font-family: var(--font-mono);
  font-size: 6px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.78;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.shelf-book-title {
  font-family: var(--font-serif);
  font-size: 7.5px;
  font-weight: 500;
  line-height: 1.2;
  margin-top: 2px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.shelf-book-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 84px;
  border-radius: 3px;
  border: 1.5px dashed var(--color-border);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 9px;
}

.shelf-edge {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 8px;
  background: linear-gradient(180deg, rgba(74, 53, 21, 0.08), rgba(74, 53, 21, 0.02));
}

/* Shelf footer */
.shelf-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px 14px;
}

.shelf-footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.shelf-icon-badge {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
}

.shelf-info {
  min-width: 0;
  display: grid;
}

.shelf-name {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-heading);
}

.shelf-meta {
  font-size: 12.5px;
  color: var(--color-text-muted);
  font-style: italic;
}

.shelf-options-btn {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 0;
  background: var(--color-surface-soft);
  color: var(--color-text-soft);
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition-fast);
}

.shelf-options-btn:hover {
  background: var(--color-border);
}

/* ─── Create shelf button ─────────────────────────── */
.create-shelf-btn {
  width: 100%;
  padding: 18px;
  border: 1.5px dashed var(--color-border);
  border-radius: 20px;
  background: transparent;
  color: var(--color-primary);
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 500;
  font-style: italic;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.create-shelf-btn:hover {
  background: var(--color-primary-surface-hover);
  border-color: var(--color-primary-border-strong);
}

/* ─── Create form ─────────────────────────────────── */
.create-form {
  display: grid;
  gap: var(--space-md);
}

.picker-section {
  display: grid;
  gap: var(--space-sm);
}

.picker-label {
  font-family: var(--font-serif);
  font-size: 13px;
  font-style: italic;
  font-weight: 500;
  color: var(--color-text-soft);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 10px;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

.icon-btn {
  aspect-ratio: 1;
  border-radius: 10px;
  border: 1.5px solid transparent;
  background: var(--color-surface);
  color: var(--color-text-soft);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all var(--transition-fast);
}

.icon-btn--active {
  border-color: currentColor;
}

.icon-btn:hover:not(.icon-btn--active) {
  background: var(--color-surface-soft);
  border-color: var(--color-border);
}

.tint-grid {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  justify-content: space-between;
}

.tint-btn {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 2.5px solid transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all var(--transition-fast);
}

.tint-btn--active {
  border-color: currentColor;
}

.create-form-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

/* ─── Options sheet ───────────────────────────────── */
.list-options {
  display: grid;
  gap: var(--space-sm);
}

.list-options-name {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
  padding: var(--space-xs) 0 var(--space-sm);
  color: var(--color-heading);
}

.list-menu-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 14px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  text-align: left;
  transition: background var(--transition-fast);
}

.list-menu-btn:hover {
  background: var(--color-surface-soft);
}

.list-menu-btn--danger {
  color: var(--color-danger-text);
  border-color: rgba(217, 83, 79, 0.22);
}

.list-menu-btn--danger:hover {
  background: rgba(217, 83, 79, 0.06);
}

/* ─── Edit form ───────────────────────────────────── */
.edit-form {
  display: grid;
  gap: var(--space-md);
}
</style>
