import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
  getStoredUser,
} from '../authStorage'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://127.0.0.1:8000/api'

let refreshPromise: Promise<string | null> | null = null

type ResponseType =
  | 'json'
  | 'blob'

async function parseResponseBody(
  response: Response,
): Promise<unknown> {
  const contentType =
    response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

function isAuthenticationFailure(
  body: unknown,
): boolean {
  if (!body || typeof body !== 'object') {
    return false
  }

  if (
    'code' in body &&
    body.code === 'token_not_valid'
  ) {
    return true
  }

  if (
    'messages' in body &&
    Array.isArray(body.messages)
  ) {
    return body.messages.some(
      (message) =>
        message &&
        typeof message === 'object' &&
        'token_class' in message &&
        message.token_class === 'AccessToken',
    )
  }

  return false
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    clearAuthSession()
    return null
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/identity/auth/refresh/`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      },
    )

    const body =
      await parseResponseBody(response)

    if (
      !response.ok ||
      !body ||
      typeof body !== 'object' ||
      !('access' in body) ||
      typeof body.access !== 'string'
    ) {
      clearAuthSession()
      return null
    }

    const storedUser =
      getStoredUser<unknown>()

    if (!storedUser) {
      clearAuthSession()
      return null
    }

    setAuthSession(
      body.access,
      refreshToken,
      storedUser,
    )

    return body.access
  } catch {
    clearAuthSession()
    return null
  }
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  allowRefresh = true,
  responseType: ResponseType = 'json',
): Promise<T> {
  const accessToken =
    getAccessToken()

  const accept =
    responseType === 'blob'
      ? 'application/pdf'
      : 'application/json'

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        Accept: accept,
        ...(accessToken
          ? {
              Authorization:
                `Bearer ${accessToken}`,
            }
          : {}),
        ...(options.body
          ? {
              'Content-Type':
                'application/json',
            }
          : {}),
        ...options.headers,
      },
    },
  )

  if (response.status === 401 && allowRefresh) {
    const body =
      await parseResponseBody(response)

    if (isAuthenticationFailure(body)) {
      const newAccessToken =
        await refreshAccessToken()

      if (newAccessToken) {
        return request<T>(
          path,
          options,
          false,
          responseType,
        )
      }
    }

    clearAuthSession()

    throw new Error(
      'La sesión ha expirado. Inicia sesión nuevamente.',
    )
  }

  if (!response.ok) {
    const body =
      await parseResponseBody(response)

    let detail =
      `API request failed: ${response.status} ${response.statusText}`

    if (
      body &&
      typeof body === 'object' &&
      'detail' in body &&
      typeof body.detail === 'string'
    ) {
      detail = body.detail
    }

    throw new Error(detail)
  }

  if (responseType === 'blob') {
    return (await response.blob()) as T
  }

  const body =
    await parseResponseBody(response)

  return body as T
}

export function httpGet<T>(
  path: string,
): Promise<T> {
  return request<T>(
    path,
    {
      method: 'GET',
    },
    true,
    'json',
  )
}

export function httpGetBlob(
  path: string,
): Promise<Blob> {
  return request<Blob>(
    path,
    {
      method: 'GET',
    },
    true,
    'blob',
  )
}

export function httpPost<T>(
  path: string,
  body: unknown,
): Promise<T> {
  return request<T>(
    path,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    true,
    'json',
  )
}

export function httpPatch<T>(
  path: string,
  body: unknown,
): Promise<T> {
  return request<T>(
    path,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
    true,
    'json',
  )
}

export function httpDelete<T>(
  path: string,
): Promise<T> {
  return request<T>(
    path,
    {
      method: 'DELETE',
    },
    true,
    'json',
  )
}
