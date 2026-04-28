export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super('API request failed')
  }
}

export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

  if (!configuredBaseUrl) {
    return ''
  }

  if (shouldUseRelativeApiBaseUrl(configuredBaseUrl)) {
    return ''
  }

  return configuredBaseUrl
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

function shouldUseRelativeApiBaseUrl(configuredBaseUrl: string) {
  if (typeof window === 'undefined') {
    return false
  }

  if (!isLocalHostname(window.location.hostname)) {
    return false
  }

  try {
    const parsedUrl = new URL(configuredBaseUrl)

    return isLocalHostname(parsedUrl.hostname) && parsedUrl.port === '3000'
  } catch {
    return false
  }
}

function isLocalHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}
