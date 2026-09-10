import "./CommercialSidebar.css"

import { NavLink, useNavigate } from 'react-router-dom'

import { useContext } from 'react'

import { AuthContext } from '../../app/auth/AuthContext'

interface NavigationItem {
  label: string
  path: string
}

const navigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/commercial',
  },
  {
    label: 'Prospectos',
    path: '/commercial/prospects',
  },
  {
    label: 'Oportunidades',
    path: '/commercial/opportunities',
  },
  {
    label: 'Cotizaciones',
    path: '/commercial/quotations',
  },

  {
    label: 'Instalaciones',
    path: '/commercial/installations',
  },
]

export default function CommercialSidebar() {
  const navigate = useNavigate()
  const auth = useContext(AuthContext)

  const handleLogout = () => {
    auth?.logout()
    navigate('/login')
  }
  return (
    <aside className="commercial-sidebar">
      <div className="commercial-brand">
        <div
          className="commercial-brand-mark"
          aria-hidden="true"
        >
          UI
        </div>

        <div className="commercial-brand-copy">
          <strong>UI-CADO</strong>
          <span>
            Sistema Operativo Digital
          </span>
        </div>
      </div>

      <div className="commercial-module">
        <span className="commercial-module-label">
          MÓDULO
        </span>
        <strong>Comercial · Prospección</strong>
      </div>

      <nav
        className="commercial-navigation"
        aria-label="Navegación Comercial"
      >
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/commercial'}
            className={({ isActive }) =>
              [
                'commercial-navigation-link',
                isActive
                  ? 'commercial-navigation-link-active'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            <span className="commercial-navigation-indicator" />

            <span className="commercial-navigation-label">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="commercial-sidebar-footer">
        <span>UI-CADO</span>
        <small>
          Enterprise Operations
        </small>
        <button
          type="button"
          className="commercial-logout-button"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
