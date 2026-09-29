import type { ReactNode } from 'react'

import CommercialHeader from '../../../shared/components/CommercialHeader'
import CommercialSidebar from '../../../shared/components/CommercialSidebar'

interface CommercialLayoutProps {
  children: ReactNode
}

export default function CommercialLayout({
  children,
}: CommercialLayoutProps) {
  return (
    <div className="crm-app-shell">
      <CommercialSidebar />

      <main className="crm-layout-main">
        <CommercialHeader />

        <section className="crm-page-content">
          {children}
        </section>
      </main>
    </div>
  )
}
