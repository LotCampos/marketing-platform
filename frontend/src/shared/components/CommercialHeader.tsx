interface CommercialHeaderProps {
  title: string
}

export default function CommercialHeader({
  title,
}: CommercialHeaderProps) {
  return (
    <header className="commercial-header">
      <div>
        <span className="header-context">OPERACIÓN / COMERCIAL</span>
        <strong>{title}</strong>
      </div>

      <div className="system-status">
        <span className="system-status-dot" />
        API operativa
      </div>
    </header>
  )
}