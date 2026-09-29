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
    <main className="crm-login-page">
      {/* =====================================================
          BRANDING
          ===================================================== */}
      <section
        className="crm-login__brand"
        aria-label="UI CADO"
      >
        <div className="crm-login__brand-content">
          <div
            className="crm-login__accent-line"
            aria-hidden="true"
          />

          <h1>UI CADO</h1>

          <h2 className='crm-text-body'>
            <strong >
              Sistema Operativo Digital
            </strong>
          </h2>

          <span className='crm-text-body'>
            Plataforma integral para la gestión,
            trazabilidad y operación de la Unidad de
            Inspección y Evaluación de la Conformidad.
          </span>
        </div>
      </section>

      {/* =====================================================
          ACCESS
          ===================================================== */}
      <section
        className="crm-login__access"
        aria-label="Acceso al sistema"
      >
        <div className="crm-login-card">
          <header>
            <p className="crm-eyebrow">
              Acceso seguro
            </p>

            <h1 className="crm-text-h1">
              Iniciar sesión
            </h1>

            <p className="crm-text-muted">
              Ingresa tu correo y contraseña para acceder.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            noValidate
          >
            <label className="crm-form-group">
              <span className="crm-text-body">
                Correo electrónico
              </span>

              <input
                className="crm-input"
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
            </label>

            <label className="crm-form-group">
              <span className="crm-text-body">
                Contraseña
              </span>

              <input
                className="crm-input"
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
            </label>

            {error && (
              <p
                className="crm-alert crm-alert--error"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              className="crm-btn crm-btn--primary crm-login-submit"
              type="submit"
              disabled={
                isLoading ||
                !email.trim() ||
                !password
              }
              aria-busy={isLoading}
            >
              {isLoading
                ? 'Autenticando...'
                : 'Iniciar sesión'}
            </button>
          </form>

          <footer className='crm-login-card-footer'>
            UI CADO · Sistema Operativo Digital
          </footer>
        </div>
      </section>
    </main>
  )
}