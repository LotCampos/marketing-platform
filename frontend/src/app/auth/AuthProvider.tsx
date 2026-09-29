import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  login as identityLogin,
  type LoginInput,
} from '../../infrastructure/api/identity/identityApi'

import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAuthSession,
} from '../../infrastructure/authStorage'

import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthContextValue['user']>(() => {
      const accessToken = getAccessToken()
      const refreshToken = getRefreshToken()
      const storedUser =
        getStoredUser<AuthContextValue['user']>()

      if (!accessToken || !refreshToken || !storedUser) {
        return null
      }

      return storedUser
    })

  const [isLoading, setIsLoading] =
    useState(false)

  const handleLogin = useCallback(
    async (credentials: LoginInput) => {
      setIsLoading(true)

      try {
        const response =
          await identityLogin(credentials)

        setAuthSession(
          response.access,
          response.refresh,
          response.user,
        )

        setUser(response.user)
      } catch (error) {
        clearAuthSession()
        setUser(null)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const handleLogout = useCallback(() => {
    clearAuthSession()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login: handleLogin,
      logout: handleLogout,
    }),
    [
      user,
      isLoading,
      handleLogin,
      handleLogout,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
