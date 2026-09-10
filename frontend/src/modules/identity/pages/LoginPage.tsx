import {
  useState,
  type FormEvent,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import type { LoginInput } from '../../../infrastructure/api/identity/identityApi'
import { useAuth } from '../../../app/auth/useAuth'

import './LoginPage.css'

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
          : 'No fue posible autenticar la sesión.',
      )
    }
  }

  return (
    <main className="login-page">
      <section
        className="login-brand"
        aria-label="UI CADO"
      >
        <div className="login-brand-content">
          <div className="login-brand-mark">
            <span className="login-brand-name">
              UI CADO
            </span>
          </div>

          <p className="login-brand-copy">
            <strong>Sistema Operativo Digital</strong>
            <br />
            Plataforma integral para la gestión,
            trazabilidad y operación de la Unidad de
            Inspección y Evaluación de la Conformidad.
          </p>

          <span
            className="login-brand-accent"
            aria-hidden="true"
          />
        </div>
      </section>

      <section
        className="login-access"
        aria-label="Acceso al sistema"
      >
        <div className="login-card">
          <header className="login-card-header">
            <p className="login-card-eyebrow">
              Acceso seguro
            </p>

            <h1 className="login-card-title">
              Iniciar sesión
            </h1>

            <p className="login-card-subtitle">
              Ingresa tus credenciales para acceder
              al sistema UI CADO.
            </p>
          </header>

          <form
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="login-field">
              <label
                className="login-label"
                htmlFor="email"
              >
                Correo electrónico
              </label>

              <input
                className="login-input"
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="usuario@uvcado.com.mx"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                disabled={isLoading}
                required
              />
            </div>

            <div className="login-field">
              <label
                className="login-label"
                htmlFor="password"
              >
                Contraseña
              </label>

              <input
                className="login-input"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <p
                className="login-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              className="login-submit"
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

          <footer className="login-card-footer">
            UI CADO · Sistema Operativo Digital
          </footer>
        </div>
      </section>
    </main>
  )
}
