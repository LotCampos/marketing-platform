import type { ReactNode } from 'react'

interface PageContainerProps {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
  children: ReactNode
}

export default function PageContainer({
  title,
  description,
  eyebrow = 'Módulo Comercial',
  actions,
  children,
}: PageContainerProps) {
  return (
    <main className="crm-page-content">
      <header className="crm-page-header">
        <div className="crm-page-header__content">
          <p className="crm-eyebrow">
            {eyebrow}
          </p>

          <h1 className="crm-text-h1">
            {title}
          </h1>

          <p className="crm-text-body">
            {description}
          </p>
        </div>

        {actions ? (
          <div className="crm-page-header__actions">
            {actions}
          </div>
        ) : null}
      </header>

      <div className="crm-page-body">
        {children}
      </div>
    </main>
  )
}
