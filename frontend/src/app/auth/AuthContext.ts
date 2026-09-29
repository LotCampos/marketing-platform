import { createContext } from 'react'
import type {
  IdentityUser,
  LoginInput,
} from '../../infrastructure/api/identity/identityApi'

export interface AuthContextValue {
  user: IdentityUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginInput) => Promise<void>
  logout: () => void
}

export const AuthContext =
  createContext<AuthContextValue | undefined>(undefined)
