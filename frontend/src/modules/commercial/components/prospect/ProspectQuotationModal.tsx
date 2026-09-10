import type { Prospect } from '../../types/commercial'

interface ProspectQuotationModalProps {
  prospect: Prospect
  open: boolean
  onClose: () => void
}

export default function ProspectQuotationModal({
  prospect,
  open,
  onClose,
}: ProspectQuotationModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="prospect-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="prospect-modal prospect-modal-large"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prospect-quotation-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="prospect-modal-header">
          <div>
            <span>
              COMERCIAL / {prospect.prospect_number}
            </span>

            <h3 id="prospect-quotation-modal-title">
              Nueva cotización
            </h3>
          </div>

          <button
            type="button"
            className="prospect-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="prospect-modal-body">
          <p className="prospect-modal-notice">
            La cotización puede emitirse antes de convertir el prospecto en
            cliente, pero debe quedar vinculada a una oportunidad comercial.
          </p>

          <p>
            Prospecto: <strong>{prospect.business_name}</strong>
          </p>

          <p>
            El siguiente paso del expediente es seleccionar o crear la
            oportunidad y capturar los conceptos de la cotización. Mientras
            el prospecto no se convierta en cliente, la cotización conservará
            <strong> cliente = nulo</strong>.
          </p>

          <button
            type="button"
            className="prospects-primary-action"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </section>
    </div>
  )
}
