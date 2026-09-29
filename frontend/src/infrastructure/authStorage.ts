const ACCESS_TOKEN_KEY =
  'ui-cado.access-token'

const REFRESH_TOKEN_KEY =
  'ui-cado.refresh-token'

const USER_KEY =
  'ui-cado.identity-user'

export function getAccessToken(): string | null {
  return localStorage.getItem(
    ACCESS_TOKEN_KEY,
  )
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(
    REFRESH_TOKEN_KEY,
  )
}

export function setAuthSession(
  accessToken: string,
  refreshToken: string,
  user: unknown,
): void {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken,
  )

  localStorage.setItem(
    REFRESH_TOKEN_KEY,
    refreshToken,
  )

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  )
}

export function getStoredUser<T>(): T | null {
  const value =
    localStorage.getItem(USER_KEY)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY,
  )

  localStorage.removeItem(
    REFRESH_TOKEN_KEY,
  )

  localStorage.removeItem(
    USER_KEY,
  )
}