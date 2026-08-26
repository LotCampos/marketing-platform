import type { ReactNode } from 'react'

interface PageContainerProps {
  title: string
  description: string
  children: ReactNode
}

export default function PageContainer({
  title,
  description,
  children,
}: PageContainerProps) {
  return (
    <main className="page-container">
      <header className="page-header">
        <div>
          <p className="eyebrow">Módulo Comercial</p>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>
      </header>

      {children}
    </main>
  )
}