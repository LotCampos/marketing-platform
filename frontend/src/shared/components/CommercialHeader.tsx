export default function CommercialHeader() {
  return (
    <header className="crm-header-global">
      <div>
        <span className="crm-eyebrow">
          OPERACIÓN COMERCIAL
        </span>

        <h1 className="crm-text-h1">
          Comercial
        </h1>
      </div>

      <div className="crm-header-status">
        <span
          className="crm-header-status__dot"
          aria-hidden="true"
        />

        <span>
          API conectada
        </span>
      </div>
    </header>
  )
}
