import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import './commercial-pages.css'

import {
  createQuotation,
  getClients,
  getOpportunities,
  getQuotationPdf,
  getQuotations,
  getServiceCatalog,
} from '../../../infrastructure/api/commercialApi'

import { useAuth } from '../../../app/auth/useAuth'

import type {
  Client,
  CreateQuotationItemInput,
  CreateQuotationInput,
  Opportunity,
  Quotation,
  ServiceCatalog,
} from '../types/commercial'

interface DraftItem extends CreateQuotationItemInput {
  key: string
}

function createEmptyItem(): DraftItem {
  return {
    key: crypto.randomUUID(),
    service_catalog_id: '',
    description: '',
    quantity: '1',
    unit_price: '0.00',
  }
}

function collectionResults<T>(
  data: T[] | { results: T[] } | undefined,
): T[] {
  if (!data) {
    return []
  }

  return Array.isArray(data) ? data : data.results
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'No fue posible completar la operación.'
}

export default function QuotationsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [quotationNumber, setQuotationNumber] = useState('')
  const [opportunityId, setOpportunityId] = useState('')
  const [clientId, setClientId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [currency, setCurrency] = useState('MXN')
  const [taxPercentage, setTaxPercentage] = useState('16.00')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<DraftItem[]>([
    createEmptyItem(),
  ])

  const quotationsQuery = useQuery({
    queryKey: ['commercial', 'quotations'],
    queryFn: getQuotations,
  })

  const opportunitiesQuery = useQuery({
    queryKey: ['commercial', 'opportunities'],
    queryFn: getOpportunities,
  })

  const clientsQuery = useQuery({
    queryKey: ['commercial', 'clients'],
    queryFn: getClients,
  })

  const serviceCatalogQuery = useQuery({
    queryKey: ['commercial', 'service-catalog'],
    queryFn: getServiceCatalog,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateQuotationInput) =>
      createQuotation(data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['commercial', 'quotations'],
      })

      resetForm()
    },
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

  const opportunities = useMemo(
    () => opportunitiesQuery.data?.results ?? [],
    [opportunitiesQuery.data],
  )

  const clients = useMemo(
    () =>
      collectionResults<Client>(
        clientsQuery.data,
      ),
    [clientsQuery.data],
  )

  const serviceCatalog = useMemo(
    () =>
      collectionResults<ServiceCatalog>(
        serviceCatalogQuery.data,
      ),
    [serviceCatalogQuery.data],
  )

  const selectedOpportunity = useMemo(
    () =>
      opportunities.find(
        (item: Opportunity) =>
          item.id === opportunityId,
      ),
    [opportunities, opportunityId],
  )

  const selectedClient = useMemo(
    () =>
      clients.find(
        (item) => item.id === clientId,
      ),
    [clients, clientId],
  )

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) *
            Number(item.unit_price || 0),
        0,
      ),
    [items],
  )

  const tax = useMemo(
    () =>
      subtotal *
      (Number(taxPercentage || 0) / 100),
    [subtotal, taxPercentage],
  )

  const total = subtotal + tax

  function resetForm() {
    setQuotationNumber('')
    setOpportunityId('')
    setClientId('')
    setValidUntil('')
    setCurrency('MXN')
    setTaxPercentage('16.00')
    setNotes('')
    setItems([createEmptyItem()])
    setIsFormOpen(false)
  }

  function updateItem(
    key: string,
    field: keyof CreateQuotationItemInput,
    value: string,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )
  }

  function addItem() {
    setItems((current) => [
      ...current,
      createEmptyItem(),
    ])
  }

  function removeItem(key: string) {
    setItems((current) => {
      if (current.length === 1) {
        return current
      }

      return current.filter(
        (item) => item.key !== key,
      )
    })
  }

  function handleOpportunityChange(
    value: string,
  ) {
    setOpportunityId(value)

    const opportunity = opportunities.find(
      (item) => item.id === value,
    )

    if (opportunity) {
      setClientId(opportunity.client_id)
    } else {
      setClientId('')
    }
  }

  function handleServiceChange(
    key: string,
    serviceCatalogId: string,
  ) {
    const service = serviceCatalog.find(
      (item) => item.id === serviceCatalogId,
    )

    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              service_catalog_id:
                serviceCatalogId,
              description:
                service?.service_name ?? '',
            }
          : item,
      ),
    )
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!user) {
      return
    }

    if (!selectedOpportunity) {
      return
    }

    if (!selectedClient) {
      return
    }

    const payload: CreateQuotationInput = {
      quotation_number:
        quotationNumber.trim(),

      opportunity_id:
        selectedOpportunity.id,

      client_id:
        selectedClient.id,

      issued_by:
        user.id,

      valid_until:
        validUntil || null,

      currency:
        currency.trim().toUpperCase(),

      notes:
        notes.trim() || null,

      tax_percentage:
        taxPercentage,

      items: items.map((item) => {
        const { key, ...quotationItem } = item
        void key
        return quotationItem
      }),
    }

    createMutation.mutate(payload)
  }

  function handlePdf(
    quotationId: string,
  ) {
    pdfMutation.mutate(quotationId)
  }

  const quotations: Quotation[] =
    quotationsQuery.data?.results ?? []

  const isLoadingDependencies =
    opportunitiesQuery.isLoading ||
    clientsQuery.isLoading ||
    serviceCatalogQuery.isLoading

  return (
    <main className="page-container commercial-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">
            COMERCIAL / COTIZACIONES
          </p>

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
            : 'Nueva cotización'}
        </button>
      </header>

      {isFormOpen && (
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>
                Nueva cotización
              </h2>

              <p>
                Registra la propuesta económica
                dentro del flujo Comercial.
              </p>
            </div>
          </div>

          {isLoadingDependencies && (
            <p>
              Cargando información comercial...
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="quotation-number">
                Número de cotización
              </label>

              <input
                id="quotation-number"
                value={quotationNumber}
                onChange={(event) =>
                  setQuotationNumber(
                    event.target.value,
                  )
                }
                required
              />
            </div>

            <div>
              <label htmlFor="opportunity">
                Oportunidad
              </label>

              <select
                id="opportunity"
                value={opportunityId}
                onChange={(event) =>
                  handleOpportunityChange(
                    event.target.value,
                  )
                }
                required
              >
                <option value="">
                  Seleccionar oportunidad
                </option>

                {opportunities.map(
                  (opportunity) => (
                    <option
                      key={opportunity.id}
                      value={opportunity.id}
                    >
                      {opportunity.opportunity_number}
                      {' — '}
                      {opportunity.title}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label htmlFor="client">
                Cliente
              </label>

              <select
                id="client"
                value={clientId}
                onChange={(event) =>
                  setClientId(
                    event.target.value,
                  )
                }
                required
              >
                <option value="">
                  Seleccionar cliente
                </option>

                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                  >
                    {client.business_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>
                Usuario emisor
              </label>

              <input
                value={
                  user
                    ? `${user.full_name} (${user.employee_number})`
                    : 'Sin usuario autenticado'
                }
                readOnly
                aria-readonly="true"
              />
            </div>

            <div>
              <label htmlFor="valid-until">
                Vigencia
              </label>

              <input
                id="valid-until"
                type="date"
                value={validUntil}
                onChange={(event) =>
                  setValidUntil(
                    event.target.value,
                  )
                }
              />
            </div>

            <div>
              <label htmlFor="currency">
                Moneda
              </label>

              <input
                id="currency"
                value={currency}
                maxLength={3}
                onChange={(event) =>
                  setCurrency(
                    event.target.value.toUpperCase(),
                  )
                }
                required
              />
            </div>

            <div>
              <label htmlFor="tax">
                IVA %
              </label>

              <input
                id="tax"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxPercentage}
                onChange={(event) =>
                  setTaxPercentage(
                    event.target.value,
                  )
                }
                required
              />
            </div>

            <div>
              <label htmlFor="notes">
                Notas
              </label>

              <textarea
                id="notes"
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value,
                  )
                }
              />
            </div>

            <section>
              <div className="panel-heading">
                <div>
                  <h3>
                    Conceptos
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                >
                  Agregar concepto
                </button>
              </div>

              {items.map((item, index) => (
                <div key={item.key}>
                  <strong>
                    Concepto {index + 1}
                  </strong>

                  <div>
                    <label>
                      Servicio
                    </label>

                    <select
                      value={
                        item.service_catalog_id
                      }
                      onChange={(event) =>
                        handleServiceChange(
                          item.key,
                          event.target.value,
                        )
                      }
                      required
                    >
                      <option value="">
                        Seleccionar servicio
                      </option>

                      {serviceCatalog.map(
                        (service) => (
                          <option
                            key={service.id}
                            value={service.id}
                          >
                            {service.service_code}
                            {' — '}
                            {service.service_name}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div>
                    <label>
                      Descripción
                    </label>

                    <input
                      value={item.description}
                      onChange={(event) =>
                        updateItem(
                          item.key,
                          'description',
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>

                  <div>
                    <label>
                      Cantidad
                    </label>

                    <input
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(
                          item.key,
                          'quantity',
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>

                  <div>
                    <label>
                      Precio unitario
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(event) =>
                        updateItem(
                          item.key,
                          'unit_price',
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>

                  <div>
                    <strong>
                      Importe
                    </strong>

                    <span>
                      {(
                        Number(item.quantity || 0) *
                        Number(item.unit_price || 0)
                      ).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeItem(item.key)
                    }
                    disabled={
                      items.length === 1
                    }
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </section>

            <section>
              <p>
                Subtotal:{' '}
                {subtotal.toFixed(2)}
              </p>

              <p>
                IVA:{' '}
                {tax.toFixed(2)}
              </p>

              <p>
                Total:{' '}
                {total.toFixed(2)}
              </p>
            </section>

            {createMutation.isError && (
              <p role="alert">
                {getErrorMessage(
                  createMutation.error,
                )}
              </p>
            )}

            <button
              type="submit"
              disabled={
                createMutation.isPending ||
                isLoadingDependencies
              }
            >
              {createMutation.isPending
                ? 'Creando cotización...'
                : 'Crear cotización'}
            </button>
          </form>
        </section>
      )}

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Cotizaciones registradas
            </h2>

            <p>
              Consulta las propuestas económicas
              registradas en el sistema.
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
