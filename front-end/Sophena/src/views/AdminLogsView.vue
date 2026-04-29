<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { IonButton, IonCard, IonCardContent, IonSpinner } from '@ionic/vue'
import { useRouter } from 'vue-router'

import EmptyStateCard from '@/components/feedback/EmptyStateCard.vue'
import AuthenticatedScaffold from '@/components/layout/AuthenticatedScaffold.vue'
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
  <AuthenticatedScaffold page-class="admin-logs-page" shell-width="58rem">
    <header class="app-page-header">
      <div class="app-page-header__title">
        <p class="app-page-kicker">Sophena</p>
        <h1 class="app-page-title">Registros do sistema</h1>
        <p class="app-page-subtitle">
          Acompanhe os acontecimentos mais recentes e use os filtros para encontrar o que precisa.
        </p>
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
        class="app-card summary-card"
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

    <IonCard class="app-card admin-logs-card">
      <IonCardContent class="logs-content">
        <form data-testid="logs-filters-form" class="filters-form" @submit.prevent="submitFilters">
          <label class="app-field">
            <span>Nível</span>
            <select name="logs-level" v-model="adminLogsStore.filters.level">
              <option value="">Todos</option>
              <option value="INFO">Informação</option>
              <option value="WARN">Aviso</option>
              <option value="ERROR">Erro</option>
            </select>
          </label>

          <label class="app-field">
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

          <label class="app-field">
            <span>Status</span>
            <input
              name="logs-status-code"
              type="text"
              inputmode="numeric"
              placeholder="Exemplo: 401"
              v-model="adminLogsStore.filters.status_code"
            />
          </label>

          <label class="app-field">
            <span>De</span>
            <input
              name="logs-from"
              type="datetime-local"
              v-model="filtersForm.from"
            />
          </label>

          <label class="app-field">
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
          class="app-feedback app-feedback--error"
          role="status"
          aria-live="polite"
        >
          {{ adminLogsStore.errorMessage }}
        </p>

        <div v-if="adminLogsStore.isLoadingLogs" class="loading-state" role="status" aria-live="polite">
          <IonSpinner name="crescent" />
          <span>Carregando os registros...</span>
          <div class="loading-skeleton-list" data-testid="logs-loading-skeleton" aria-hidden="true">
            <div v-for="index in 4" :key="index" class="app-skeleton-card" data-testid="skeleton-block">
              <div class="app-skeleton app-skeleton-text app-skeleton-text--short"></div>
              <div class="app-skeleton app-skeleton-text app-skeleton-text--long"></div>
              <div class="app-skeleton app-skeleton-text app-skeleton-text--medium"></div>
            </div>
          </div>
        </div>

        <EmptyStateCard
          v-else-if="showEmptyState"
          title="Nenhum registro foi encontrado."
          description="Tente ajustar os filtros para buscar outro período ou outro tipo de registro."
        />

        <ul v-else class="logs-list app-fade-in">
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
              <div class="log-meta-route">
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
  </AuthenticatedScaffold>
</template>

<style scoped>
.back-button {
  --color: var(--color-primary);
  --border-color: var(--color-primary);
  --border-radius: var(--radius-lg);
}

.summary-grid {
  display: grid;
  gap: var(--space-sm);
}

.summary-card {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
}

.summary-card--info {
  border-top: 4px solid var(--color-success);
}

.summary-card--warn {
  border-top: 4px solid var(--color-warning);
}

.summary-card--error {
  border-top: 4px solid var(--color-danger);
}

.summary-label {
  color: var(--color-muted);
  font-weight: 700;
}

.summary-value {
  display: block;
  margin-top: var(--space-xs);
  color: var(--color-heading);
  font-size: 22px;
  font-weight: 700;
}

.logs-content {
  display: grid;
  gap: var(--space-md);
}

.filters-form {
  display: grid;
  gap: var(--space-sm);
}

.filter-button {
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
  width: min(100%, 40rem);
  display: grid;
  gap: var(--space-sm);
}

.logs-list {
  display: grid;
  gap: var(--space-sm);
  list-style: none;
  padding: 0;
}

.log-card {
  display: grid;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  border: 1px solid rgba(215, 222, 207, 0.92);
  border-radius: 1rem;
  background: rgba(255, 253, 249, 0.9);
}

.log-card-top {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.log-badge {
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
}

.log-badge--info {
  background: rgba(47, 93, 66, 0.12);
  color: var(--color-success);
}

.log-badge--warn {
  background: rgba(143, 106, 37, 0.14);
  color: #825c18;
}

.log-badge--error {
  background: rgba(157, 63, 52, 0.12);
  color: var(--color-danger);
}

.log-date {
  color: var(--color-muted);
  font-size: 0.92rem;
}

.log-message {
  color: var(--color-heading);
  font-weight: 700;
}

.log-meta {
  display: grid;
  gap: 0.65rem;
}

.log-meta div {
  display: grid;
  gap: 0.2rem;
}

.log-meta dt {
  color: var(--color-muted);
  font-size: 0.84rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.log-meta dd {
  color: var(--color-heading);
}

.pagination-bar {
  display: grid;
  gap: 0.75rem;
  align-items: center;
}

.pagination-button {
  --border-radius: 999px;
  font-weight: 700;
}

.pagination-text {
  text-align: center;
  color: var(--color-muted);
}

@media (min-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .filters-form {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
  }

  .pagination-bar {
    grid-template-columns: auto 1fr auto;
  }

  .log-meta {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .log-card-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
