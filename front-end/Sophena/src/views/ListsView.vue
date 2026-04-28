<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { IonButton, IonCard, IonCardContent, IonSpinner } from '@ionic/vue'
import { useRouter } from 'vue-router'

import EmptyStateCard from '@/components/feedback/EmptyStateCard.vue'
import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
import { useAuthStore } from '@/stores/auth'
import { useListsStore } from '@/stores/lists'

const router = useRouter()
const authStore = useAuthStore()
const listsStore = useListsStore()
const listNameInput = ref<HTMLInputElement | null>(null)

const form = reactive({
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

onMounted(async () => {
  await listsStore.fetchLists()
})

async function submitCreateList() {
  try {
    await listsStore.createList(form.name.trim())
    form.name = ''
  } catch {
    // A mensagem amigável já é controlada pelo store.
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

      <div v-if="authStore.user?.is_admin" class="header-note">
        <strong>Admin</strong>
        <span>Você também pode acessar atalhos administrativos pelo dock inferior.</span>
      </div>
    </header>

    <IonCard class="app-card hero-card">
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
      </div>

      <EmptyStateCard
        v-else-if="showEmptyState"
        title="Você ainda não criou nenhuma lista."
        description="Crie sua primeira lista para começar."
        action-label="Criar minha primeira lista"
        action-testid="empty-create-list"
        @action="focusCreateList"
      />

      <ul v-else class="lists-grid">
        <li v-for="list in listsStore.items" :key="list.id">
          <button
            type="button"
            class="list-link"
            :data-testid="`list-link-${list.id}`"
            @click="openList(list.id)"
          >
            <span class="list-link-copy">
              <strong>{{ list.name }}</strong>
              <small>Toque para abrir e organizar seus livros</small>
            </span>
            <span class="list-link-action">Abrir</span>
          </button>
        </li>
      </ul>
    </section>
  </AuthenticatedScaffold>
</template>

<style scoped>
.header-note {
  width: min(100%, 15rem);
  display: grid;
  gap: 0.25rem;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(88, 113, 95, 0.18);
  border-radius: 1rem;
  background: rgba(255, 253, 249, 0.75);
  color: var(--color-muted);
}

.header-note strong {
  color: var(--color-heading);
  font-size: 0.92rem;
  font-weight: 700;
}

.hero-card-content {
  display: grid;
  gap: 1rem;
}

.hero-copy {
  display: grid;
  gap: 0.35rem;
}

.hero-kicker {
  color: #58715f;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h2,
.section-heading h2 {
  color: var(--color-heading);
  font-size: 1.25rem;
  font-weight: 700;
}

.hero-copy p {
  color: var(--color-muted);
}

.create-list-form {
  display: grid;
  gap: 0.85rem;
}

.create-button {
  --background: var(--color-primary);
  --background-hover: var(--color-primary-strong);
  --border-radius: 999px;
  min-height: 3.2rem;
  font-weight: 700;
}

.lists-section {
  display: grid;
  gap: 0.85rem;
}

.section-heading {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.section-count {
  min-width: 2rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(51, 92, 71, 0.08);
  color: var(--color-primary);
  font-weight: 700;
  text-align: center;
}

.loading-state {
  display: grid;
  gap: 0.65rem;
  justify-items: start;
  color: var(--color-muted);
}

.lists-grid {
  display: grid;
  gap: 0.85rem;
  list-style: none;
  padding: 0;
}

.list-link {
  width: 100%;
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 1.05rem 1.1rem;
  border: 1px solid rgba(215, 222, 207, 0.92);
  border-radius: 1.1rem;
  background: rgba(255, 253, 249, 0.9);
  color: #22332c;
  text-align: left;
  box-shadow: 0 10px 26px rgba(58, 71, 53, 0.06);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    border-color var(--transition-fast);
}

.list-link:hover {
  transform: translateY(-1px);
  border-color: rgba(78, 129, 102, 0.26);
  box-shadow: 0 14px 28px rgba(58, 71, 53, 0.08);
}

.list-link:focus-visible {
  outline: 3px solid rgba(78, 129, 102, 0.22);
  outline-offset: 2px;
}

.list-link-copy {
  display: grid;
  gap: 0.2rem;
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

@media (min-width: 768px) {
  .hero-card-content {
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 22rem);
    align-items: end;
  }
}

@media (max-width: 640px) {
  .list-link {
    align-items: flex-start;
  }

  .list-link-action {
    padding-top: 0.15rem;
  }
}
</style>
