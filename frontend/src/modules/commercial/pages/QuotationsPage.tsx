import { useState } from 'react'

import {
  useMutation,
  useQuery,
} from '@tanstack/react-query'

import {
  getQuotationPdf,
  getQuotations,
} from '../../../infrastructure/api/commercialApi'

import type {
  Quotation,
} from '../types/commercial'

import QuotationForm from '../components/quotation/QuotationForm'
import CommercialTable from '../../../shared/components/CommercialTable'

export default function QuotationsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)

  const quotationsQuery = useQuery({
    queryKey: ['commercial', 'quotations'],
    queryFn: getQuotations,
  })

  const pdfMutation = useMutation({
    mutationFn: (quotationId: string) =>
      getQuotationPdf(quotationId),

    onSuccess: (blob) => {
      const objectUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')

      link.href = objectUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'

      link.click()

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl)
      }, 60_000)
    },
  })

  const quotations: Quotation[] =
    quotationsQuery.data?.results ?? []

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }

    return 'No fue posible completar la operación.'
  }

  function handlePdf(quotationId: string) {
    pdfMutation.mutate(quotationId)
  }

  function formatAmount(value: string | number) {
    const amount =
      typeof value === 'number'
        ? value
        : Number(value)

    if (!Number.isFinite(amount)) {
      return String(value)
    }

    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }

  return (
    <main className="crm-page-content">
      <header className="crm-page-header">
        <div className="crm-page-header__content">
          <p className="crm-eyebrow">
            COMERCIAL / COTIZACIONES
          </p>

          <h1 className="crm-text-h1">
            Cotizaciones comerciales
          </h1>

          <p className="crm-text-body">
            Gestión de propuestas económicas
            asociadas a oportunidades.
          </p>
        </div>

        <div className="crm-page-header__actions">
          <button
            type="button"
            className="crm-btn crm-btn--primary"
            onClick={() =>
              setIsFormOpen((current) => !current)
            }
          >
            {isFormOpen
              ? 'Cancelar'
              : 'Nueva cotización'}
          </button>
        </div>
      </header>

      <div className="crm-page-body">
        {isFormOpen && (
          <QuotationForm
            onSuccess={() => setIsFormOpen(false)}
            onCancel={() => setIsFormOpen(false)}
          />
        )}

        <section className="crm-panel">
          <header className="crm-panel__header">
            <div className="crm-panel__heading">
              <p className="crm-eyebrow">
                VISTA COMERCIAL
              </p>

              <h2 className="crm-panel__title">
                Cotizaciones registradas
              </h2>

              <p className="crm-text-body">
                Listado general de cotizaciones
                registradas en el sistema.
              </p>
            </div>

            <div className="crm-panel__meta">
              {quotationsQuery.isLoading
                ? 'Cargando'
                : `${quotationsQuery.data?.count ?? quotations.length} registros`}
            </div>
          </header>

          <div className="crm-panel__body">
            {quotationsQuery.isLoading && (
              <div className="crm-display-sunken">
                <p className="crm-text-body">
                  Cargando cotizaciones...
                </p>
              </div>
            )}

            {quotationsQuery.isError && (
              <p
                role="alert"
                className="crm-modal-notice crm-modal-notice--error"
              >
                {getErrorMessage(
                  quotationsQuery.error,
                )}
              </p>
            )}

            {!quotationsQuery.isLoading &&
              !quotationsQuery.isError && (
                <CommercialTable
                  headers={[
                    'Cotización',
                    'Moneda',
                    'Subtotal',
                    'IVA',
                    'Total',
                    'Creada',
                    'Acciones',
                  ]}
                  emptyMessage="No existen cotizaciones registradas."
                >
                  {quotations.map((quotation) => (
                    <tr
                      key={quotation.id}
                      className="crm-table__tr"
                    >
                      <td className="crm-table__td crm-table__td--primary">
                        <span className="crm-table__primary">
                          {quotation.quotation_number}
                        </span>

                        <span className="crm-table__secondary">
                          Propuesta comercial
                        </span>
                      </td>

                      <td className="crm-table__td crm-table__td--secondary">
                        {quotation.currency}
                      </td>

                      <td className="crm-table__td crm-table__td--amount">
                        {formatAmount(
                          quotation.subtotal,
                        )}
                      </td>

                      <td className="crm-table__td crm-table__td--amount">
                        {formatAmount(
                          quotation.tax_amount,
                        )}
                      </td>

                      <td className="crm-table__td crm-table__td--amount">
                        {formatAmount(
                          quotation.total_amount,
                        )}
                      </td>

                      <td className="crm-table__td crm-table__td--secondary">
                        {formatDate(
                          quotation.created_at,
                        )}
                      </td>

                      <td className="crm-table__td">
                        <div className="crm-table__actions">
                          <button
                            type="button"
                            className="crm-btn crm-btn--secondary"
                            onClick={() =>
                              handlePdf(
                                quotation.id,
                              )
                            }
                            disabled={
                              pdfMutation.isPending
                            }
                            aria-disabled={
                              pdfMutation.isPending
                            }
                          >
                            {pdfMutation.isPending
                              ? 'Generando...'
                              : 'Ver PDF'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </CommercialTable>
              )}

            {pdfMutation.isError && (
              <p
                role="alert"
                className="crm-modal-notice crm-modal-notice--error"
              >
                {getErrorMessage(
                  pdfMutation.error,
                )}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
