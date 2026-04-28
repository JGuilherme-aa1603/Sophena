<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { IonButton, IonCard, IonCardContent, IonContent, IonPage, IonSpinner } from '@ionic/vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useListsStore } from '@/stores/lists'

const router = useRouter()
const authStore = useAuthStore()
const listsStore = useListsStore()

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

const feedbackMessage = computed(() => {
  return authStore.errorMessage || listsStore.errorMessage
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

async function openAdminArea() {
  await router.push('/app/admin')
}

async function exitSession() {
  try {
    await authStore.logout()
    await router.replace('/login')
  } catch {
    // A mensagem amigável já é controlada pelo store.
  }
}
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="lists-page">
        <section class="lists-shell">
          <header class="lists-header">
            <div>
              <p class="lists-kicker">Sophena</p>
              <h1>{{ greeting }}</h1>
              <p class="lists-subtitle">Escolha uma lista para continuar ou crie uma nova.</p>
            </div>

            <div class="header-actions">
              <IonButton
                v-if="authStore.user?.is_admin"
                class="admin-button"
                data-testid="open-admin-area"
                fill="outline"
                @click="openAdminArea"
              >
                Área administrativa
              </IonButton>

              <IonButton class="exit-button" fill="outline" @click="exitSession">
                Sair
              </IonButton>
            </div>
          </header>

          <IonCard class="lists-card">
            <IonCardContent>
              <form class="create-list-form" @submit.prevent="submitCreateList">
                <label class="field">
                  <span>Nova lista</span>
                  <input
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

              <p v-if="feedbackMessage" class="feedback-message" role="status" aria-live="polite">
                {{ feedbackMessage }}
              </p>

              <div v-if="listsStore.isLoading" class="loading-state" role="status" aria-live="polite">
                <IonSpinner name="crescent" />
                <span>Carregando suas listas...</span>
              </div>

              <div v-else-if="showEmptyState" class="empty-state">
                <h2>Você ainda não criou nenhuma lista.</h2>
                <p>Crie sua primeira lista para começar.</p>
              </div>

              <ul v-else class="lists-grid">
                <li v-for="list in listsStore.items" :key="list.id">
                  <button
                    type="button"
                    class="list-link"
                    :data-testid="`list-link-${list.id}`"
                    @click="openList(list.id)"
                  >
                    <strong>{{ list.name }}</strong>
                    <span>Abrir lista</span>
                  </button>
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
.lists-page {
  min-height: 100%;
  padding: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(223, 236, 221, 0.9), transparent 28%),
    radial-gradient(circle at bottom right, rgba(239, 229, 198, 0.8), transparent 28%),
    linear-gradient(180deg, #f6f2e8 0%, #fcfbf7 100%);
}

.lists-shell {
  width: min(100%, 46rem);
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.lists-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.lists-kicker {
  margin-bottom: 0.45rem;
  color: #58715f;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.lists-header h1 {
  color: #20332b;
  font-family: 'Atkinson Hyperlegible', 'Trebuchet MS', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}

.lists-subtitle {
  margin-top: 0.65rem;
  color: #476055;
}

.lists-card {
  margin: 0;
  border-radius: 1.25rem;
  box-shadow: 0 18px 50px rgba(58, 71, 53, 0.1);
}

.create-list-form {
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

.create-button {
  --background: #335c47;
  --background-hover: #284b3a;
  --border-radius: 0.95rem;
  min-height: 3rem;
  font-weight: 700;
}

.feedback-message {
  margin-top: 1rem;
  color: #7c3b33;
}

.loading-state,
.empty-state {
  display: grid;
  justify-items: start;
  gap: 0.65rem;
  margin-top: 1.25rem;
  color: #43584d;
}

.empty-state h2 {
  color: #20332b;
  font-size: 1.15rem;
  font-weight: 700;
}

.lists-grid {
  margin-top: 1.25rem;
  display: grid;
  gap: 0.85rem;
  list-style: none;
  padding: 0;
}

.list-link {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.1rem;
  border: 1px solid #d6decf;
  border-radius: 1rem;
  background: #fffdf9;
  color: #22332c;
  text-align: left;
}

.list-link strong {
  font-size: 1rem;
  font-weight: 700;
}

.list-link span {
  color: #58715f;
}

.list-link:focus {
  outline: 3px solid rgba(78, 129, 102, 0.2);
  border-color: #4e8166;
}

.exit-button {
  --color: #335c47;
  --border-color: #335c47;
  --border-radius: 0.95rem;
}

.admin-button {
  --color: #335c47;
  --border-color: #335c47;
  --border-radius: 0.95rem;
}

@media (min-width: 768px) {
  .lists-page {
    padding: 2rem;
  }
}

@media (max-width: 640px) {
  .lists-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: stretch;
  }
}
</style>
