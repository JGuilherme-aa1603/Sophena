import { requestJson } from './http'

export type AdminLogItem = {
  id: string
  level: 'INFO' | 'WARN' | 'ERROR'
  status_code: number
  message: string | null
  route: string | null
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | null
  user_id: string | null
  created_at: string
}

export type AdminLogsResponse = {
  items: AdminLogItem[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export type AdminLogsSummary = {
  success_count: number
  warn_count: number
  error_count: number
}

export async function fetchAdminLogsRequest(
  accessToken: string,
  params: {
    level?: string
    method?: string
    status_code?: string
    from?: string
    to?: string
    page: number
    limit: number
  },
) {
  const query = new URLSearchParams()

  if (params.level) query.set('level', params.level)
  if (params.method) query.set('method', params.method)
  if (params.status_code) query.set('status_code', params.status_code)
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  query.set('page', String(params.page))
  query.set('limit', String(params.limit))

  return requestJson<AdminLogsResponse>(`/admin/logs?${query.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function fetchAdminLogsSummaryRequest(accessToken: string) {
  return requestJson<AdminLogsSummary>('/admin/logs/summary', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}
