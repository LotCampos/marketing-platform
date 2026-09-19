import { useState } from 'react'
import {
  useMutation,
  useQuery,
} from '@tanstack/react-query'

import './quotations-page.css'

import {
  getQuotationPdf,
  getQuotations,
} from '../../../infrastructure/api/commercialApi'

import type {
  Quotation,
} from '../types/commercial'

import QuotationForm from '../components/quotation/QuotationForm'

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

  return (
    <main className="page-container commercial-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            COMERCIAL / COTIZACIONES
          </span>

          <h1>
            Cotizaciones comerciales
          </h1>

          <p className="page-description">
            Gestión de propuestas económicas
            asociadas a oportunidades.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsFormOpen((current) => !current)
          }
        >
          {isFormOpen
            ? 'Cerrar'
            : '+ Nueva cotización'}
        </button>
      </header>

      {isFormOpen && (
        <QuotationForm
          onSuccess={() => setIsFormOpen(false)}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">
              VISTA COMERCIAL
            </p>
            <h2>
              Cotizaciones registradas
              </h2>
            <p>
              Listado general de cotizaciones registradas en el sistema
              </p>
  
          </div>
        </div>

        {quotationsQuery.isLoading && (
          <p>
            Cargando cotizaciones...
          </p>
        )}

        {quotationsQuery.isError && (
          <p role="alert">
            {getErrorMessage(
              quotationsQuery.error,
            )}
          </p>
        )}

        {!quotationsQuery.isLoading &&
          !quotationsQuery.isError &&
          quotations.length === 0 && (
            <p>
              No existen cotizaciones registradas.
            </p>
          )}

        {quotations.length > 0 && (
          <div>
            {quotations.map((quotation) => (
              <article
                key={quotation.id}
              >
                <div>
                  <strong>
                    {quotation.quotation_number}
                  </strong>

                  <span>
                    {quotation.currency}
                  </span>
                </div>

                <div>
                  <span>
                    Subtotal:{' '}
                    {quotation.subtotal}
                  </span>

                  <span>
                    IVA:{' '}
                    {quotation.tax_amount}
                  </span>

                  <strong>
                    Total:{' '}
                    {quotation.total_amount}
                  </strong>
                </div>

                <div>
                  <span>
                    Creada:{' '}
                    {new Date(
                      quotation.created_at,
                    ).toLocaleString(
                      'es-MX',
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      handlePdf(
                        quotation.id,
                      )
                    }
                    disabled={
                      pdfMutation.isPending
                    }
                  >
                    {pdfMutation.isPending
                      ? 'Generando PDF...'
                      : 'Ver PDF'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {pdfMutation.isError && (
          <p role="alert">
            {getErrorMessage(
              pdfMutation.error,
            )}
          </p>
        )}
      </section>
    </main>
  )
}
