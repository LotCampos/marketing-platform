import { NavLink } from 'react-router-dom'

const navigation = [
  {
    label: 'Resumen',
    path: '/commercial',
  },
  {
    label: 'Prospectos',
    path: '/commercial/prospects',
  },
  {
    label: 'Solicitudes',
    path: '/commercial/service-requests',
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
    label: 'Contratos',
    path: '/commercial/agreements',
  },
]

export default function CommercialSidebar() {
  return (
    <aside className="commercial-sidebar">
      <div className="brand">
        <div className="brand-mark">UI</div>

        <div>
          <strong>UI-CADO</strong>
          <span>Sistema Operativo Digital</span>
        </div>
      </div>

      <div className="module-label">COMERCIAL</div>

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
              isActive
                ? 'navigation-link active'
                : 'navigation-link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>UI-CADO</span>
        <small>Enterprise Operations</small>
      </div>
    </aside>
  )
}