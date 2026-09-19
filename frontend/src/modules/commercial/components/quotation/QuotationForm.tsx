import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createQuotation,
  getClients,
  getCommercialClauseTemplates,
  getCommercialComponentTypes,
  getOpportunities,
  getServiceCatalog,
} from '../../../../infrastructure/api/commercialApi'
import { useAuth } from '../../../../app/auth/useAuth'

import type {
  Client,
  CommercialClauseTemplate,
  CommercialComponentType,
  CreateQuotationComponentInput,
  CreateQuotationItemInput,
  CreateQuotationInput,
  Opportunity,
  ServiceCatalog,
} from '../../types/commercial'

interface DraftItem extends CreateQuotationItemInput {
  key: string
}

interface DraftComponent extends CreateQuotationComponentInput {

  key: string

}

export interface QuotationFormProps {
  initialOpportunityId?: string
  initialClientId?: string | null
  prospectId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

function createEmptyItem(): DraftItem {
  return {
    key: crypto.randomUUID(),
    service_catalog_id: '',
    description: '',
    quantity: 1,
    unit_price: 0,
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

export default function QuotationForm({
  initialOpportunityId = '',
  initialClientId = null,
  prospectId,
  onSuccess,
  onCancel,
}: QuotationFormProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [quotationNumber, setQuotationNumber] = useState('')
  const [opportunityId, setOpportunityId] = useState(initialOpportunityId)
  const [clientId, setClientId] = useState(initialClientId ?? '')
  const [validUntil, setValidUntil] = useState('')
  const [currency, setCurrency] = useState('MXN')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<DraftItem[]>([
    createEmptyItem(),
  ])

  const [components, setComponents] = useState<DraftComponent[]>([])

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

  const componentTypesQuery = useQuery({

    queryKey: ['commercial', 'component-types'],

    queryFn: getCommercialComponentTypes,

  })

  const clauseTemplatesQuery = useQuery({

    queryKey: ['commercial', 'clause-templates'],

    queryFn: getCommercialClauseTemplates,

  })

  const createMutation = useMutation({
    mutationFn: (data: CreateQuotationInput) =>
      createQuotation(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['commercial', 'quotations'],
      })

      resetForm()
      onSuccess?.()
    },
  })

  const opportunities = useMemo(() => {
    const allOpportunities =
      opportunitiesQuery.data?.results ?? []

    if (!prospectId) {
      return allOpportunities
    }

    return allOpportunities.filter(
      (opportunity) =>
        opportunity.prospect === prospectId,
    )
  }, [opportunitiesQuery.data, prospectId])

  const clients = useMemo(
    () => collectionResults<Client>(clientsQuery.data),
    [clientsQuery.data],
  )

  const serviceCatalog = useMemo(
    () => collectionResults<ServiceCatalog>(
      serviceCatalogQuery.data,
    ),
    [serviceCatalogQuery.data],
  )

  const componentTypes = useMemo(
    () =>
      collectionResults<CommercialComponentType>(
        componentTypesQuery.data,
      ),
    [componentTypesQuery.data],
  )

  const clauseTemplates = useMemo(
    () =>
      collectionResults<CommercialClauseTemplate>(
        clauseTemplatesQuery.data,
      ),
    [clauseTemplatesQuery.data],
  )

  const activeClauseTemplates = useMemo(
    () =>
      clauseTemplates.filter(
        (template) => template.is_active,
      ),
    [clauseTemplates],
  )

  const selectedOpportunity = useMemo(
    () =>
      opportunities.find(
        (item: Opportunity) => item.id === opportunityId,
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
    () => subtotal * 0.16,
    [subtotal],
  )

  const total = subtotal + tax

  const isLoadingDependencies =
    opportunitiesQuery.isLoading ||
    clientsQuery.isLoading ||
    serviceCatalogQuery.isLoading ||
    componentTypesQuery.isLoading ||
    clauseTemplatesQuery.isLoading

  function addComponent() {
    const defaultType =
      componentTypes.find(
        (type) => type.code === 'TRAVEL_EXPENSE',
      ) ??
      componentTypes[0]

    if (!defaultType) {
      return
    }

    setComponents((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        component_type_code: defaultType.code,
        treatment: 'INCLUDED',
        amount: 0,
        display_mode:
          defaultType.code === 'TRAVEL_EXPENSE'
            ? 'CLAUSE'
            : 'HIDDEN',
        clause_code:
          defaultType.code === 'TRAVEL_EXPENSE'
            ? (
                activeClauseTemplates.find(
                  (template) =>
                    template.component_type_code ===
                      defaultType.code &&
                    template.treatment === 'INCLUDED',
                )?.code ?? null
              )
            : null,
      },
    ])
  }

  function updateComponent(
    key: string,
    patch: Partial<DraftComponent>,
  ) {
    setComponents((current) =>
      current.map((component) =>
        component.key === key
          ? { ...component, ...patch }
          : component,
      ),
    )
  }

  function removeComponent(key: string) {
    setComponents((current) =>
      current.filter((component) => component.key !== key),
    )
  }

  function resetForm() {
    setQuotationNumber('')
    setOpportunityId(initialOpportunityId)
    setClientId(initialClientId ?? '')
    setValidUntil('')
    setCurrency('MXN')
    setNotes('')
    setItems([createEmptyItem()])
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

  function handleOpportunityChange(value: string) {
    setOpportunityId(value)

    const opportunity = opportunities.find(
      (item) => item.id === value,
    )

    if (opportunity) {
      setClientId(opportunity.client_id ?? '')
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

    if (!prospectId && !selectedClient) {
      return
    }

    const payload: CreateQuotationInput = {
      quotation_number:
        quotationNumber.trim(),
      opportunity_id:
        selectedOpportunity.id,
      client_id:
        prospectId
          ? selectedOpportunity.client_id
          : selectedClient?.id ?? null,
      issued_by:
        user.id,
      valid_until:
        validUntil || null,
      currency:
        currency.trim().toUpperCase(),
      notes:
        notes.trim() || null,
      items: items.map((item) => {
        const { key, ...quotationItem } = item
        void key
        return quotationItem
      }),
      components: components.map((component) => {
        const { key, ...quotationComponent } = component
        void key
        return quotationComponent
      }),
    }

    createMutation.mutate(payload)
  }

  const formContent = (
    <>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            DATOS GENERALES
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

        {!prospectId && (
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
        )}

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
            IVA
          </label>

          <input
            id="tax"
            type="text"
            value="16%"
            readOnly
            aria-readonly="true"
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
                  min="1"
                  step="1"
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
                  step="1"
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
                <label>
                  Importe
                </label>

                <span>
                  {(
                    item.quantity *
                    item.unit_price
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

        <section className="quotation-components-section">
          <div className="panel-heading">
            <div>
              <h3>Componentes comerciales</h3>
              <p>
                Configure viáticos, traslados, materiales y otros componentes
                conforme al catálogo comercial.
              </p>
            </div>

            <button
              type="button"
              onClick={addComponent}
              disabled={componentTypes.length === 0}
            >
              Agregar componente
            </button>
          </div>

          {components.map((component, index) => {
            const selectedType = componentTypes.find(
              (type) =>
                type.code === component.component_type_code,
            )

            const componentClauses =
              activeClauseTemplates.filter(
                (template) =>
                  template.component_type_code ===
                  component.component_type_code,
              )

            const selectedClause =
              componentClauses.find(
                (template) =>
                  template.code === component.clause_code &&
                  template.treatment === component.treatment,
              )

            const isClauseMode =
              component.display_mode === 'CLAUSE'

            return (
              <div
                key={component.key}
                className="quotation-component-card"
              >
                <strong>
                  Componente {index + 1}
                </strong>

                <div>
                  <label htmlFor={`component-type-${component.key}`}>
                    Tipo de componente
                  </label>
                  <select
                    id={`component-type-${component.key}`}
                    value={component.component_type_code}
                    onChange={(event) => {
                      const nextCode =
                        event.target.value
                      const nextClause =
                        activeClauseTemplates.find(
                          (template) =>
                            template.component_type_code ===
                              nextCode &&
                            template.treatment ===
                              component.treatment,
                        )

                      updateComponent(component.key, {
                        component_type_code:
                          nextCode,
                        clause_code:
                          nextClause?.code ?? null,
                        display_mode:
                          nextClause
                            ? 'CLAUSE'
                            : 'HIDDEN',
                      })
                    }}
                  >
                    {componentTypes.map((type) => (
                      <option
                        key={type.id}
                        value={type.code}
                      >
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`component-treatment-${component.key}`}>
                    Tratamiento económico
                  </label>
                  <select
                    id={`component-treatment-${component.key}`}
                    value={component.treatment}
                    onChange={(event) => {
                      const treatment =
                        event.target.value as DraftComponent['treatment']

                      const nextClause =
                        activeClauseTemplates.find(
                          (template) =>
                            template.component_type_code ===
                              component.component_type_code &&
                            template.treatment ===
                              treatment,
                        )

                      updateComponent(component.key, {
                        treatment,
                        clause_code:
                          nextClause?.code ?? null,
                        display_mode:
                          nextClause
                            ? 'CLAUSE'
                            : 'HIDDEN',
                      })
                    }}
                  >
                    <option value="INCLUDED">
                      Incluido
                    </option>
                    <option value="ADDITIONAL">
                      Adicional
                    </option>
                    <option value="INFORMATIVE">
                      Informativo
                    </option>
                  </select>
                </div>

                <div>
                  <label htmlFor={`component-amount-${component.key}`}>
                    Importe
                  </label>
                  <input
                    id={`component-amount-${component.key}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={component.amount ?? 0}
                    onChange={(event) =>
                      updateComponent(
                        component.key,
                        {
                          amount:
                            Number(
                              event.target.value,
                            ) || 0,
                        },
                      )
                    }
                  />
                </div>

                {isClauseMode && (
                  <div>
                    <label htmlFor={`component-clause-${component.key}`}>
                      Cláusula controlada
                    </label>
                    <select
                      id={`component-clause-${component.key}`}
                      value={component.clause_code ?? ''}
                      onChange={(event) =>
                        updateComponent(
                          component.key,
                          {
                            clause_code:
                              event.target.value ||
                              null,
                          },
                        )
                      }
                    >
                      <option value="">
                        Seleccionar cláusula
                      </option>

                      {componentClauses
                        .filter(
                          (template) =>
                            template.treatment ===
                            component.treatment,
                        )
                        .map((template) => (
                          <option
                            key={template.id}
                            value={template.code}
                          >
                            {template.name} · v
                            {template.version}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {selectedClause && (
                  <div className="quotation-component-clause-preview">
                    <label>
                      Texto controlado
                    </label>
                    <span>
                      {selectedClause.template_text}
                    </span>
                  </div>
                )}

                <div>
                  <span>
                    {selectedType?.name ??
                      component.component_type_code}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      removeComponent(component.key)
                    }
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
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

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            gridColumn: '1 / -1',
          }}
        >
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
            >
              Cancelar
            </button>
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
        </div>
      </form>
    </>
  )

  if (prospectId) {
    return <>{formContent}</>
  }

  return (
    <section className="dashboard-panel">
      {formContent}
    </section>
  )
}
