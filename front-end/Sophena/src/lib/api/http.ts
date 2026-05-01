export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super('API request failed')
  }
}

type BrowserLocation = Pick<Location, 'hostname' | 'origin'>

export function getApiBaseUrl(currentLocation: BrowserLocation | null = readBrowserLocation()) {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

  if (!configuredBaseUrl) {
    return ''
  }

  if (shouldUseRelativeApiBaseUrl(configuredBaseUrl, currentLocation)) {
    return ''
  }

  if (shouldUseSameOriginApiProxy(configuredBaseUrl, currentLocation)) {
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

function shouldUseRelativeApiBaseUrl(configuredBaseUrl: string, currentLocation: BrowserLocation | null) {
  if (!currentLocation) {
    return false
  }

  try {
    const parsedUrl = new URL(configuredBaseUrl)

    if (parsedUrl.origin === currentLocation.origin) {
      return true
    }

    return isLocalHostname(currentLocation.hostname) &&
      isLocalHostname(parsedUrl.hostname) &&
      parsedUrl.port === '3000'
  } catch {
    return false
  }
}

function shouldUseSameOriginApiProxy(configuredBaseUrl: string, currentLocation: BrowserLocation | null) {
  if (!currentLocation || isLocalHostname(currentLocation.hostname)) {
    return false
  }

  try {
    const parsedUrl = new URL(configuredBaseUrl)

    return parsedUrl.origin !== currentLocation.origin
  } catch {
    return false
  }
}

function readBrowserLocation() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.location
}

function isLocalHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}
