import {
  useState,
  type FormEvent,
} from 'react'

import { useLocation, useNavigate } from 'react-router-dom'

import type { LoginInput } from '../../../infrastructure/api/identity/identityApi'
import { useAuth } from '../../../app/auth/useAuth'

interface LoginLocationState {
  from?: string
}

export default function LoginPage() {
  const { login, isLoading } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const state =
    location.state as
      | LoginLocationState
      | null

  const destination =
    state?.from ?? '/commercial'

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [error, setError] =
    useState<string | null>(null)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    setError(null)

    const credentials: LoginInput = {
      email: email.trim(),
      password,
    }

    try {
      await login(credentials)

      navigate(destination, {
        replace: true,
      })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to authenticate.',
      )
    }
  }

  return (
    <main>
      <section>
        <header>
          <p>UI-CADO</p>
          <h1>Acceso al sistema</h1>
          <p>
            Sistema Operativo Digital
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
        >
          <div>
            <label htmlFor="email">
              Correo electrónico
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <p role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              isLoading ||
              !email.trim() ||
              !password
            }
          >
            {isLoading
              ? 'Autenticando...'
              : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </main>
  )
}
