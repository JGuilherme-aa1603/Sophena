<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import { filterOutline, refreshOutline, searchOutline } from 'ionicons/icons'

import type { BookCoverFilter } from '@/lib/api/books'

type BookListFilters = {
  search: string
  author: string
  cover: BookCoverFilter
}

const props = withDefaults(defineProps<{
  layout: 'comfortable' | 'compact'
  testIdPrefix: string
  isLoading?: boolean
  formTestid?: string
  searchName?: string
  authorName?: string
  coverName?: string
}>(), {
  isLoading: false,
  formTestid: undefined,
  searchName: 'book-search',
  authorName: 'book-author',
  coverName: 'book-cover',
})

const emit = defineEmits<{
  search: [filters: BookListFilters]
  clear: []
  'update:layout': [layout: 'comfortable' | 'compact']
}>()

const isOpen = ref(false)
const form = reactive<BookListFilters>({
  search: '',
  author: '',
  cover: 'all',
})

const panelId = computed(() => `${props.testIdPrefix}-controls-panel`)
const formTestid = computed(() => props.formTestid ?? `${props.testIdPrefix}-filters-form`)
const isCompactLayout = computed(() => props.layout === 'compact')

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function submitFilters() {
  emit('search', {
    search: form.search,
    author: form.author,
    cover: form.cover,
  })
}

function clearFilters() {
  form.search = ''
  form.author = ''
  form.cover = 'all'
  emit('clear')
}

function updateLayout(layout: 'comfortable' | 'compact') {
  emit('update:layout', layout)
}
</script>

<template>
  <section class="book-controls-menu">
    <button
      type="button"
      class="book-controls-toggle app-interactive"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      :data-testid="`${testIdPrefix}-controls-toggle`"
      @click="toggleMenu"
    >
      <span class="button-inline-content">
        <IonIcon :icon="filterOutline" aria-hidden="true" />
        Filtros e visualização
      </span>
    </button>

    <div
      v-if="isOpen"
      :id="panelId"
      class="book-controls-panel app-fade-in"
      :data-testid="panelId"
    >
      <form
        class="book-controls-form"
        :data-testid="formTestid"
        @submit.prevent="submitFilters"
      >
        <label class="app-field">
          <span>Buscar livro</span>
          <input
            :name="searchName"
            type="text"
            autocomplete="off"
            placeholder="Digite o título ou o autor"
            :disabled="isLoading"
            v-model="form.search"
          />
        </label>

        <label class="app-field">
          <span>Filtrar por autor</span>
          <input
            :name="authorName"
            type="text"
            autocomplete="off"
            placeholder="Digite o nome do autor"
            :disabled="isLoading"
            v-model="form.author"
          />
        </label>

        <label class="app-field">
          <span>Capa</span>
          <select :name="coverName" :disabled="isLoading" v-model="form.cover">
            <option value="all">Todos</option>
            <option value="with">Com capa</option>
            <option value="without">Sem capa</option>
          </select>
        </label>

        <div class="layout-toggle" aria-label="Escolher visualização dos livros">
          <span class="layout-toggle-label">Visualização</span>
          <div class="layout-toggle-actions">
            <button
              type="button"
              class="layout-toggle-button"
              :class="{ 'layout-toggle-button--active': !isCompactLayout }"
              :data-testid="`${testIdPrefix}-layout-comfortable`"
              :aria-pressed="!isCompactLayout"
              @click="updateLayout('comfortable')"
            >
              Linha
            </button>

            <button
              type="button"
              class="layout-toggle-button"
              :class="{ 'layout-toggle-button--active': isCompactLayout }"
              :data-testid="`${testIdPrefix}-layout-compact`"
              :aria-pressed="isCompactLayout"
              @click="updateLayout('compact')"
            >
              Compacta
            </button>
          </div>
        </div>

        <div class="book-controls-actions">
          <IonButton class="search-button" type="submit" :disabled="isLoading">
            <span class="button-inline-content">
              <IonIcon :icon="searchOutline" aria-hidden="true" />
              Buscar
            </span>
          </IonButton>

          <IonButton
            fill="outline"
            class="clear-button"
            type="button"
            :data-testid="`clear-${testIdPrefix}-filters`"
            :disabled="isLoading"
            @click="clearFilters"
          >
            <span class="button-inline-content">
              <IonIcon :icon="refreshOutline" aria-hidden="true" />
              Limpar filtros
            </span>
          </IonButton>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.book-controls-menu {
  display: grid;
  gap: var(--space-sm);
}

.book-controls-toggle {
  width: 100%;
  min-height: 3rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-heading);
  font: inherit;
  font-weight: 700;
  box-shadow: var(--shadow-sm);
}

.book-controls-toggle:focus-visible,
.layout-toggle-button:focus-visible {
  outline: 3px solid rgba(53, 95, 74, 0.22);
  outline-offset: 2px;
}

.book-controls-panel {
  padding: var(--space-md);
  border: 1px solid rgba(226, 224, 219, 0.96);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-sm);
}

.book-controls-form,
.book-controls-actions {
  display: grid;
  gap: var(--space-sm);
}

.layout-toggle {
  display: grid;
  gap: var(--space-sm);
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

@media (min-width: 768px) {
  .book-controls-toggle {
    width: auto;
    justify-self: start;
  }

  .book-controls-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
