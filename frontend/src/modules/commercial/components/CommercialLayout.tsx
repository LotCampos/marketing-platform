import type { ReactNode } from 'react'

import CommercialSidebar from '../../../shared/components/CommercialSidebar'

interface CommercialLayoutProps {
  children: ReactNode
}

export default function CommercialLayout({
  children,
}: CommercialLayoutProps) {
  return (
    <div className="commercial-shell">
      <CommercialSidebar />

      <main className="commercial-main">
        <header className="commercial-header">
          <div>
            <span className="commercial-header-kicker">
              OPERACIÓN COMERCIAL
            </span>

            <h1>Comercial</h1>
          </div>

          <div className="commercial-header-status">
            <span className="status-indicator" />
            <span>API conectada</span>
          </div>
        </header>

        <section className="commercial-content">
          {children}
        </section>
      </main>
    </div>
  )
}