import { useState } from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createAgreement,
  getAgreementPdf,
  getAgreements,
  getQuotations,
} from '../../../infrastructure/api/commercialApi'

import CommercialTable from '../../../shared/components/CommercialTable'
import StatusBadge from '../../../shared/components/StatusBadge'

const EMPTY_FORM = {
  agreement_number: '',
  quotation_id: '',
  legal_name: '',
  tax_id: '',
  legal_representative_name: '',
  legal_representative_tax_id: '',
  employer_registration: '',
  effective_from: '',
  effective_until: '',
  notes: '',
}

export default function AgreementsPage() {
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState(EMPTY_FORM)

  const agreementsQuery = useQuery({
    queryKey: ['commercial', 'agreements'],
    queryFn: getAgreements,
  })

  const quotationsQuery = useQuery({
    queryKey: ['commercial', 'quotations'],
    queryFn: getQuotations,
  })

  const createMutation = useMutation({
    mutationFn: createAgreement,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['commercial', 'agreements'],
      })

      setShowForm(false)
      setForm(EMPTY_FORM)
    },
  })

  const pdfMutation = useMutation({
    mutationFn: (agreementId: string) =>
      getAgreementPdf(agreementId),
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

  function handlePdf(agreementId: string) {
    pdfMutation.mutate(agreementId)
  }

  const agreements =
    agreementsQuery.data?.results ?? []

  const quotations =
    quotationsQuery.data?.results ?? []

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const quotation = quotations.find(
      (item) => item.id === form.quotation_id,
    )

    if (!quotation || !quotation.client_id) {
      return
    }

    createMutation.mutate({
      agreement_number: form.agreement_number,
      quotation_id: quotation.id,
      opportunity_id: quotation.opportunity_id,
      client_id: quotation.client_id,
      legal_name: form.legal_name || null,
      tax_id: form.tax_id || null,
      legal_representative_name:
        form.legal_representative_name || null,
      legal_representative_tax_id:
        form.legal_representative_tax_id || null,
      employer_registration:
        form.employer_registration || null,
      status: 'DRAFT',
      effective_from: form.effective_from || null,
      effective_until: form.effective_until || null,
      notes: form.notes || null,
    })
  }

  function handleCancel() {
    if (createMutation.isPending) {
      return
    }

    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  return (
    <main className="crm-page-content">
      <header className="crm-page-header">
        <div className="crm-page-header__content">
          <p className="crm-eyebrow">
            COMERCIAL / FORMALIZACIÓN
          </p>

          <h1 className="crm-text-h1">
            Acuerdos
          </h1>

          <p className="crm-text-body">
            Control de la formalización contractual
            derivada de oportunidades y
            cotizaciones comerciales.
          </p>
        </div>

        <div className="crm-page-header__actions">
          <button
            type="button"
            className="crm-btn crm-btn--primary"
            onClick={() =>
              setShowForm((value) => !value)
            }
            disabled={createMutation.isPending}
            aria-disabled={
              createMutation.isPending
            }
          >
            {showForm
              ? 'Cancelar'
              : 'Nuevo acuerdo'}
          </button>
        </div>
      </header>

      <div className="crm-page-body">
        {showForm && (
          <section className="crm-panel">
            <header className="crm-panel__header">
              <div className="crm-panel__heading">
                <span className="crm-eyebrow">
                  FORMALIZACIÓN CONTRACTUAL
                </span>

                <h2 className="crm-panel__title">
                  Nuevo acuerdo
                </h2>
              </div>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="crm-panel__body">
                <div className="crm-form-grid">
                  <label className="crm-form-group">
                    <span className="crm-label">
                      Número de acuerdo
                    </span>

                    <input
                      required
                      className="crm-input"
                      value={form.agreement_number}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          agreement_number:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="crm-form-group">
                    <span className="crm-label">
                      Cotización
                    </span>

                    <select
                      required
                      className="crm-select"
                      value={form.quotation_id}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          quotation_id:
                            event.target.value,
                        })
                      }
                      disabled={
                        quotationsQuery.isLoading ||
                        createMutation.isPending
                      }
                      aria-disabled={
                        quotationsQuery.isLoading ||
                        createMutation.isPending
                      }
                    >
                      <option value="">
                        Seleccionar cotización
                      </option>

                      {quotations.map(
                        (quotation) => (
                          <option
                            key={quotation.id}
                            value={quotation.id}
                          >
                            {
                              quotation.quotation_number
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="crm-form-group">
                    <span className="crm-label">
                      Razón social
                    </span>

                    <input
                      className="crm-input"
                      value={form.legal_name}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          legal_name:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="crm-form-group">
                    <span className="crm-label">
                      RFC
                    </span>

                    <input
                      className="crm-input"
                      value={form.tax_id}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          tax_id:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="crm-form-group">
                    <span className="crm-label">
                      Representante legal
                    </span>

                    <input
                      className="crm-input"
                      value={
                        form.legal_representative_name
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          legal_representative_name:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="crm-form-group">
                    <span className="crm-label">
                      RFC representante
                    </span>

                    <input
                      className="crm-input"
                      value={
                        form.legal_representative_tax_id
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          legal_representative_tax_id:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="crm-form-group">
                    <span className="crm-label">
                      Registro patronal
                    </span>

                    <input
                      className="crm-input"
                      value={
                        form.employer_registration
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          employer_registration:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="crm-form-group">
                    <span className="crm-label">
                      Inicio
                    </span>

                    <input
                      type="date"
                      className="crm-input"
                      value={form.effective_from}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          effective_from:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="crm-form-group">
                    <span className="crm-label">
                      Vencimiento
                    </span>

                    <input
                      type="date"
                      className="crm-input"
                      value={form.effective_until}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          effective_until:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="crm-form-group crm-form-group--full">
                    <span className="crm-label">
                      Notas
                    </span>

                    <textarea
                      className="crm-textarea"
                      value={form.notes}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          notes: event.target.value,
                        })
                      }
                      rows={4}
                    />
                  </label>

                  {createMutation.isError && (
                    <div
                      className="crm-modal-notice crm-modal-notice--error crm-form-group--full"
                      role="alert"
                    >
                      No fue posible crear el
                      acuerdo.
                    </div>
                  )}

                  {quotationsQuery.isError && (
                    <div
                      className="crm-modal-notice crm-modal-notice--error crm-form-group--full"
                      role="alert"
                    >
                      No fue posible cargar las
                      cotizaciones disponibles.
                    </div>
                  )}
                </div>
              </div>

              <footer className="crm-panel__footer">
                <button
                  type="button"
                  className="crm-btn crm-btn--secondary"
                  onClick={handleCancel}
                  disabled={createMutation.isPending}
                  aria-disabled={
                    createMutation.isPending
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="crm-btn crm-btn--primary"
                  disabled={
                    createMutation.isPending
                  }
                  aria-disabled={
                    createMutation.isPending
                  }
                >
                  {createMutation.isPending
                    ? 'Guardando...'
                    : 'Guardar acuerdo'}
                </button>
              </footer>
            </form>
          </section>
        )}

        {agreementsQuery.isError && (
          <div
            className="crm-modal-notice crm-modal-notice--error"
            role="alert"
          >
            No fue posible cargar los contratos.
          </div>
        )}

        <section className="crm-panel">
          <header className="crm-panel__header">
            <div className="crm-panel__heading">
              <span className="crm-eyebrow">
                REGISTRO COMERCIAL
              </span>

              <h2 className="crm-panel__title">
                Acuerdos registrados
              </h2>
            </div>

            <div className="crm-panel__meta">
              {agreementsQuery.isLoading
                ? 'Cargando'
                : `${agreementsQuery.data?.count ?? agreements.length} registros`}
            </div>
          </header>

          <div className="crm-panel__body">
            {agreementsQuery.isLoading ? (
              <div className="crm-empty-state">
                <p className="crm-text-body">
                  Cargando acuerdos...
                </p>
              </div>
            ) : (
              <CommercialTable
                headers={[
                  'Número',
                  'Cotización',
                  'Oportunidad',
                  'Cliente',
                  'Estado',
                  'Inicio',
                  'Vencimiento',
                  'Acciones',
                ]}
              >
                {agreements.length === 0 ? (
                  <tr className="crm-table__tr">
                    <td
                      colSpan={8}
                      className="crm-table__td"
                    >
                      No existen acuerdos
                      registrados.
                    </td>
                  </tr>
                ) : (
                  agreements.map((item) => (
                    <tr
                      key={item.id}
                      className="crm-table__tr"
                    >
                      <td className="crm-table__td crm-table__td--primary">
                        {item.agreement_number}
                      </td>

                      <td className="crm-table__td">
                        {item.quotation_id}
                      </td>

                      <td className="crm-table__td">
                        {item.opportunity_id}
                      </td>

                      <td className="crm-table__td">
                        {item.client_id}
                      </td>

                      <td className="crm-table__td">
                        <StatusBadge
                          value={item.status}
                        />
                      </td>

                      <td className="crm-table__td">
                        {item.effective_from ?? '—'}
                      </td>

                      <td className="crm-table__td">
                        {item.effective_until ?? '—'}
                      </td>
                      <td className="crm-table__td">
                        <div className="crm-table__actions">
                          <button
                            type="button"
                            className="crm-btn crm-btn--secondary"
                            onClick={() => handlePdf(item.id)}
                            disabled={pdfMutation.isPending}
                            aria-disabled={pdfMutation.isPending}
                          >
                            {pdfMutation.isPending
                              ? 'Generando...'
                              : 'Ver PDF'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </CommercialTable>
            )}
          </div>
        </section>

        {pdfMutation.isError && (
          <div
            className="crm-modal-notice crm-modal-notice--error"
            role="alert"
          >
            {pdfMutation.error instanceof Error
              ? pdfMutation.error.message
              : 'No fue posible generar el PDF del acuerdo.'}
          </div>
        )}
      </div>
    </main>
  )
}
