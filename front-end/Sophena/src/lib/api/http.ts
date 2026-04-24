export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super('API request failed')
  }
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
}

export async function requestJson<T>(
  path: string,
  input: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...input,
    credentials: 'include',
  })

  const contentType = response.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    throw new ApiError(response.status, body)
  }

  return body as T
}
