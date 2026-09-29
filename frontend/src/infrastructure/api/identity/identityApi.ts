import { httpPost } from '../httpClient'

export interface IdentityUser {
  id: string
  email: string
  employee_number: string
  full_name: string
  system_role: string
  is_active: boolean
  version_lock: number
}

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: IdentityUser
}

export interface RefreshResponse {
  access: string
}

export function login(
  data: LoginInput,
): Promise<LoginResponse> {
  return httpPost<LoginResponse>(
    '/identity/auth/login/',
    data,
  )
}

export function refreshAccessToken(
  refresh: string,
): Promise<RefreshResponse> {
  return httpPost<RefreshResponse>(
    '/identity/auth/refresh/',
    { refresh },
  )
}
