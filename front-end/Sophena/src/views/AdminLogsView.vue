<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { IonButton, IonCard, IonCardContent, IonContent, IonPage, IonSpinner } from '@ionic/vue'
import { useRouter } from 'vue-router'

import { useAdminLogsStore } from '@/stores/admin-logs'

const router = useRouter()
const adminLogsStore = useAdminLogsStore()
const filtersForm = reactive({
  from: '',
  to: '',
})

const summaryCards = computed(() => [
  { label: 'Informação', value: adminLogsStore.summary.success_count, tone: 'info' },
  { label: 'Aviso', value: adminLogsStore.summary.warn_count, tone: 'warn' },
  { label: 'Erro', value: adminLogsStore.summary.error_count, tone: 'error' },
])

const showEmptyState = computed(() => {
  return !adminLogsStore.isLoadingLogs
    && adminLogsStore.logs.length === 0
    && !adminLogsStore.errorMessage
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(adminLogsStore.pagination.total / adminLogsStore.pagination.limit))
})

onMounted(async () => {
  filtersForm.from = isoToLocalDateTimeValue(adminLogsStore.filters.from)
  filtersForm.to = isoToLocalDateTimeValue(adminLogsStore.filters.to)

  await Promise.all([
    adminLogsStore.fetchSummary(),
    adminLogsStore.fetchLogs(),
  ])
})

async function submitFilters() {
  adminLogsStore.filters.from = localDateTimeToUtcIso(filtersForm.from)
  adminLogsStore.filters.to = localDateTimeToUtcIso(filtersForm.to)
  adminLogsStore.pagination.page = 1
  await adminLogsStore.fetchLogs()
}

async function goToNextPage() {
  adminLogsStore.goToNextPage()
  await adminLogsStore.fetchLogs()
}

async function goToPreviousPage() {
  adminLogsStore.goToPreviousPage()
  await adminLogsStore.fetchLogs()
}

async function goBack() {
  await router.push('/app/admin')
}

function formatLevel(level: 'INFO' | 'WARN' | 'ERROR') {
  if (level === 'INFO') return 'Informação'
  if (level === 'WARN') return 'Aviso'
  return 'Erro'
}

function localDateTimeToUtcIso(value: string) {
  if (!value) {
    return ''
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toISOString()
}

function isoToLocalDateTimeValue(value: string) {
  if (!value) {
    return ''
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')
  const hours = String(parsedDate.getHours()).padStart(2, '0')
  const minutes = String(parsedDate.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatDateTime(value: string) {
  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Data indisponível'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsedDate)
}
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <main class="admin-logs-page">
        <section class="admin-logs-shell">
          <header class="admin-logs-header">
            <div>
              <p class="admin-logs-kicker">Sophena</p>
              <h1>Registros do sistema</h1>
              <p class="admin-logs-subtitle">Acompanhe os acontecimentos mais recentes e use os filtros para encontrar o que precisa.</p>
            </div>

            <IonButton
              class="back-button"
              fill="outline"
              data-testid="back-to-app"
              @click="goBack"
            >
              Voltar
            </IonButton>
          </header>

          <section class="summary-grid">
            <IonCard
              v-for="card in summaryCards"
              :key="card.label"
              class="summary-card"
              :class="`summary-card--${card.tone}`"
            >
              <IonCardContent>
                <p class="summary-label">{{ card.label }}</p>
                <strong class="summary-value">
                  <IonSpinner v-if="adminLogsStore.isLoadingSummary" name="crescent" />
                  <template v-else>{{ card.value }}</template>
                </strong>
              </IonCardContent>
            </IonCard>
          </section>

          <IonCard class="admin-logs-card">
            <IonCardContent>
              <form data-testid="logs-filters-form" class="filters-form" @submit.prevent="submitFilters">
                <label class="field">
                  <span>Nível</span>
                  <select name="logs-level" v-model="adminLogsStore.filters.level">
                    <option value="">Todos</option>
                    <option value="INFO">Informação</option>
                    <option value="WARN">Aviso</option>
                    <option value="ERROR">Erro</option>
                  </select>
                </label>

                <label class="field">
                  <span>Método</span>
                  <select name="logs-method" v-model="adminLogsStore.filters.method">
                    <option value="">Todos</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </label>

                <label class="field">
                  <span>Status</span>
                  <input
                    name="logs-status-code"
                    type="text"
                    inputmode="numeric"
                    placeholder="Exemplo: 401"
                    v-model="adminLogsStore.filters.status_code"
                  />
                </label>

                <label class="field">
                  <span>De</span>
                  <input
                    name="logs-from"
                    type="datetime-local"
                    v-model="filtersForm.from"
                  />
                </label>

                <label class="field">
                  <span>Até</span>
                  <input
                    name="logs-to"
                    type="datetime-local"
                    v-model="filtersForm.to"
                  />
                </label>

                <IonButton class="filter-button" type="submit" :disabled="adminLogsStore.isLoadingLogs">
                  <span v-if="!adminLogsStore.isLoadingLogs">Aplicar filtros</span>
                  <IonSpinner v-else name="crescent" />
                </IonButton>
              </form>

              <p
                v-if="adminLogsStore.errorMessage"
                class="feedback-message error-message"
                role="status"
                aria-live="polite"
              >
                {{ adminLogsStore.errorMessage }}
              </p>

              <div v-if="adminLogsStore.isLoadingLogs" class="loading-state" role="status" aria-live="polite">
                <IonSpinner name="crescent" />
                <span>Carregando os registros...</span>
              </div>

              <div v-else-if="showEmptyState" class="empty-state">
                <h2>Nenhum registro foi encontrado.</h2>
                <p>Tente ajustar os filtros para buscar outro período ou outro tipo de registro.</p>
              </div>

              <ul v-else class="logs-list">
                <li v-for="log in adminLogsStore.logs" :key="log.id" class="log-card">
                  <div class="log-card-top">
                    <span class="log-badge" :class="`log-badge--${log.level.toLowerCase()}`">
                      {{ formatLevel(log.level) }}
                    </span>
                    <span class="log-date">{{ formatDateTime(log.created_at) }}</span>
                  </div>

                  <strong class="log-message">{{ log.message || 'Sem descrição disponível.' }}</strong>

                  <dl class="log-meta">
                    <div>
                      <dt>Método</dt>
                      <dd>{{ log.method || 'Não informado' }}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{{ log.status_code }}</dd>
                    </div>
                    <div>
                      <dt>Caminho</dt>
                      <dd>{{ log.route || 'Não informado' }}</dd>
                    </div>
                  </dl>
                </li>
              </ul>

              <div class="pagination-bar">
                <IonButton
                  fill="outline"
                  class="pagination-button"
                  :disabled="adminLogsStore.pagination.page <= 1 || adminLogsStore.isLoadingLogs"
                  @click="goToPreviousPage"
                >
                  Página anterior
                </IonButton>

                <p class="pagination-text">
                  Página {{ adminLogsStore.pagination.page }} de {{ totalPages }}
                </p>

                <IonButton
                  fill="outline"
                  class="pagination-button"
                  :disabled="adminLogsStore.pagination.page >= totalPages || adminLogsStore.isLoadingLogs"
                  @click="goToNextPage"
                >
                  Próxima página
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </section>
      </main>
    </IonContent>
  </IonPage>
</template>

<style scoped>
.admin-logs-page {
  min-height: 100%;
  padding: 1.25rem;
  background:
    radial-gradient(circle at top left, rgba(223, 236, 221, 0.9), transparent 28%),
    radial-gradient(circle at bottom right, rgba(239, 229, 198, 0.8), transparent 28%),
    linear-gradient(180deg, #f6f2e8 0%, #fcfbf7 100%);
}

.admin-logs-shell {
  width: min(100%, 58rem);
  margin: 0 auto;
  display: grid;
  gap: 1rem;
}

.admin-logs-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
}

.admin-logs-kicker {
  margin-bottom: 0.45rem;
  color: #58715f;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-logs-header h1 {
  color: #20332b;
  font-family: 'Atkinson Hyperlegible', 'Trebuchet MS', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
}

.admin-logs-subtitle {
  margin-top: 0.65rem;
  color: #476055;
}

.summary-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-card {
  margin: 0;
  border-radius: 1rem;
}

.summary-card--info {
  background: #f2f6ef;
}

.summary-card--warn {
  background: #fff4df;
}

.summary-card--error {
  background: #fde9e6;
}

.summary-label {
  color: #476055;
}

.summary-value {
  display: block;
  margin-top: 0.35rem;
  color: #20332b;
  font-size: 1.6rem;
}

.admin-logs-card {
  margin: 0;
  border-radius: 1.25rem;
  box-shadow: 0 18px 50px rgba(58, 71, 53, 0.1);
}

.filters-form {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 0.45rem;
  color: #22332c;
}

.field span {
  font-weight: 700;
}

.field input,
.field select {
  width: 100%;
  padding: 0.95rem 1rem;
  border: 1px solid #c7d1c2;
  border-radius: 0.9rem;
  background: #fffdf9;
  font: inherit;
  color: #1c2b25;
}

.filter-button,
.pagination-button,
.back-button {
  --border-radius: 0.95rem;
}

.filter-button {
  --background: #335c47;
  --background-hover: #284b3a;
  font-weight: 700;
  align-self: end;
}

.feedback-message {
  margin-top: 1rem;
}

.error-message {
  color: #7c3b33;
}

.loading-state,
.empty-state {
  display: grid;
  gap: 0.65rem;
  justify-items: start;
  margin-top: 1.25rem;
  color: #43584d;
}

.empty-state h2 {
  color: #20332b;
  font-size: 1.15rem;
  font-weight: 700;
}

.logs-list {
  display: grid;
  gap: 0.85rem;
  list-style: none;
  margin: 1.25rem 0 0;
  padding: 0;
}

.log-card {
  padding: 1rem 1.05rem;
  border: 1px solid #d6decf;
  border-radius: 1rem;
  background: #fffdf9;
}

.log-card-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
}

.log-badge {
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}

.log-badge--info {
  background: #e7f0e3;
  color: #234b31;
}

.log-badge--warn {
  background: #fff0cf;
  color: #845400;
}

.log-badge--error {
  background: #fde2df;
  color: #8a2f28;
}

.log-date {
  color: #5d7067;
  font-size: 0.9rem;
}

.log-message {
  display: block;
  margin-top: 0.75rem;
  color: #20332b;
}

.log-meta {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 0.85rem;
}

.log-meta dt {
  font-weight: 700;
  color: #476055;
}

.log-meta dd {
  margin: 0.2rem 0 0;
  color: #22332c;
  word-break: break-word;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.85rem;
  margin-top: 1.25rem;
}

.pagination-text {
  color: #476055;
}

@media (max-width: 767px) {
  .admin-logs-header {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .filters-form {
    grid-template-columns: 1fr;
  }

  .log-card-top,
  .pagination-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .log-meta {
    grid-template-columns: 1fr;
  }
}
</style>
