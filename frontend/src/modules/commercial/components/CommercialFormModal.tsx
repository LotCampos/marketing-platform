import {
  useEffect,
  type MouseEvent,
  type ReactNode,
} from 'react'

import './commercial-forms.css'

interface CommercialFormModalProps {
  children: ReactNode
  onClose: () => void
  title?: string
  ariaLabel?: string
  className?: string
}

export default function CommercialFormModal({
  children,
  onClose,
  title = 'Formulario',
  ariaLabel,
  className = '',
}: CommercialFormModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      onClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const handleBackdropMouseDown = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget) {
      return
    }

    onClose()
  }

  return (
    <div
      className="commercial-form-modal"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className={`commercial-form-modal-window ${className}`.trim()}
      >
        <button
          type="button"
          className="commercial-form-modal-close"
          onClick={onClose}
          aria-label="Cerrar formulario"
          title="Cerrar"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 6l12 12"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 6L6 18"
            />
          </svg>
        </button>

        <div className="commercial-form-modal-content">
          {children}
        </div>
      </div>
    </div>
  )
}