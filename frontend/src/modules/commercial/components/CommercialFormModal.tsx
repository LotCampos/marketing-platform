import {
  useEffect,
  type MouseEvent,
  type ReactNode,
} from 'react'

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
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      onClose()
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [onClose])

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [])

  const handleBackdropMouseDown = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (
      event.target !== event.currentTarget
    ) {
      return
    }

    onClose()
  }

  return (
    <div
      className="crm-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className={`crm-modal ${className}`.trim()}
      >
        <button
          type="button"
          className="crm-modal__close"
          onClick={onClose}
          aria-label="Cerrar formulario"
          title="Cerrar"
        >
        
        </button>

        <div className="crm-modal__body">
          {children}
        </div>
      </div>
    </div>
  )
}