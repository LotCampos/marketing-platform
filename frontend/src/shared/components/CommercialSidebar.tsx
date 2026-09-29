import { useContext } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

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
    label: 'Instalaciones',
    path: '/commercial/installations',
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
    label: 'Acuerdos',
    path: '/commercial/agreements',
  },
]

export default function CommercialSidebar() {
  const navigate = useNavigate()
  const auth = useContext(AuthContext)

  function handleLogout() {
    auth?.logout()
    navigate('/login')
  }

  return (
    <aside className="crm-sidebar">
      <div className="crm-sidebar__brand">
        <div
          className="crm-sidebar__logo"
          aria-hidden="true"
        >
          UI
        </div>

        <div className="crm-sidebar__brand-text">
          <strong>UI CADO</strong>
          <span>Sistema Operativo Digital</span>
        </div>
      </div>

      <div className="crm-sidebar__module">
        <span className="crm-eyebrow">
          MÓDULO
        </span>

        <strong className="crm-text-muted">
          Comercial · Prospección
        </strong>
      </div>

      <nav
        className="crm-sidebar__nav"
        aria-label="Navegación Comercial"
      >
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/commercial'}
            className="crm-nav-link"
          >
            <span
              className="crm-nav-link__indicator"
              aria-hidden="true"
            />

            <span className="crm-nav-link__label">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

        
        <div className="crm-sidebar-footer">
           <button
          type="button"
          className="crm-btn crm-btn--secondary"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>

        <p className="crm-text-muted">
          Unidad de Inspección CADO
          Sistema Operativo Digital
        </p>
      </div>
    </aside>
  )
}
