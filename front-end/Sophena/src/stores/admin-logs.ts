import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  fetchAdminLogsRequest,
  fetchAdminLogsSummaryRequest,
  type AdminLogItem,
  type AdminLogsSummary,
} from '@/lib/api/admin-logs'
import { ApiError } from '@/lib/api/http'
import { useAuthStore } from './auth'

function mapAdminLogsError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return 'Confira os filtros e tente novamente.'
    }

    if (error.status === 403) {
      return 'Você não tem permissão para ver os registros.'
    }
  }

  return 'Não foi possível carregar os registros agora.'
}

export const useAdminLogsStore = defineStore('admin-logs', () => {
  const authStore = useAuthStore()
  const logs = ref<AdminLogItem[]>([])
  const summary = ref<AdminLogsSummary>({
    success_count: 0,
    warn_count: 0,
    error_count: 0,
  })
  const isLoadingLogs = ref(false)
  const isLoadingSummary = ref(false)
  const errorMessage = ref('')
  const filters = reactive({
    level: '',
    method: '',
    status_code: '',
    from: '',
    to: '',
  })
  const pagination = reactive({
    page: 1,
    limit: 20,
    total: 0,
  })

  async function fetchSummary() {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      return
    }

    isLoadingSummary.value = true

    try {
      summary.value = await fetchAdminLogsSummaryRequest(authStore.accessToken)
    } catch (error) {
      errorMessage.value = mapAdminLogsError(error)
    } finally {
      isLoadingSummary.value = false
    }
  }

  async function fetchLogs() {
    if (!authStore.accessToken) {
      errorMessage.value = 'Sua sessão expirou. Entre novamente.'
      logs.value = []
      return
    }

    isLoadingLogs.value = true
    errorMessage.value = ''

    try {
      const response = await fetchAdminLogsRequest(authStore.accessToken, {
        level: filters.level,
        method: filters.method,
        status_code: filters.status_code,
        from: filters.from,
        to: filters.to,
        page: pagination.page,
        limit: pagination.limit,
      })

      logs.value = response.items
      pagination.page = response.pagination.page
      pagination.limit = response.pagination.limit
      pagination.total = response.pagination.total
    } catch (error) {
      logs.value = []
      errorMessage.value = mapAdminLogsError(error)
    } finally {
      isLoadingLogs.value = false
    }
  }

  function goToNextPage() {
    const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit))

    if (pagination.page < totalPages) {
      pagination.page += 1
    }
  }

  function goToPreviousPage() {
    if (pagination.page > 1) {
      pagination.page -= 1
    }
  }

  return {
    logs,
    summary,
    isLoadingLogs,
    isLoadingSummary,
    errorMessage,
    filters,
    pagination,
    fetchSummary,
    fetchLogs,
    goToNextPage,
    goToPreviousPage,
  }
})
