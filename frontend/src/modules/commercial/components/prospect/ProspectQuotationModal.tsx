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
  if (!open) {
    return null
  }

  return (
    <div
      className="crm-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="crm-modal crm-modal--large"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prospect-quotation-modal-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="crm-modal__header">
          <div>
            <span className="crm-eyebrow">
              COMERCIAL / {prospect.prospect_number}
            </span>

            <h3
              id="prospect-quotation-modal-title"
              className="crm-text-h2"
            >
              Nueva cotización
            </h3>
          </div>

          <button
            type="button"
            className="crm-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="crm-modal__body">
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