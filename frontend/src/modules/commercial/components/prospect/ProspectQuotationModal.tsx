import QuotationForm from '../quotation/QuotationForm'
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
  if (!open) return null

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
            <span>COMERCIAL / {prospect.prospect_number}</span>
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
          <QuotationForm
            prospectId={prospect.id}
            onSuccess={onClose}
            onCancel={onClose}
          />
        </div>
      </section>
    </div>
  )
}
