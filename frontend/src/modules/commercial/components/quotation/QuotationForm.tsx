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
    () => {
      const itemsSubtotal = items.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) *
            Number(item.unit_price || 0),
        0,
      )

      const includedComponents = components.reduce(
        (sum, component) =>
          component.treatment === 'INCLUDED'
            ? sum + Number(component.amount || 0)
            : sum,
        0,
      )

      return itemsSubtotal + includedComponents
    },
    [items, components],
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
    <form
      className="crm-panel"
      onSubmit={handleSubmit}
    >
      <header className="crm-panel__header">
        <div className="crm-panel__heading">
          <span className="crm-eyebrow">
            NUEVO REGISTRO
          </span>

          <h2 className="crm-text-h2">
            Formulario de cotización
          </h2>

          <p className="crm-text-body">
            Registre una cotización potencial
            antes de convertirla en cliente.
          </p>
        </div>
      </header>

      <div className="crm-form__body">

        {isLoadingDependencies && (
          <p className="crm-text-body">
            Cargando información comercial...
          </p>
        )}

        <section className="crm-form-section">
          <header className="crm-panel-title">
            <span className="crm-eyebrow">
              01
            </span>

            <h3 className="crm-text-h2">
              Datos de la cotización
            </h3>

            <p className="crm-text-body">
              Información comercial y administrativa de la cotización.
            </p>
          </header>

          <div className="crm-form-grid">
        <div className="crm-form-group">
          <label className="crm-label" htmlFor="quotation-number">
            Número de cotización
          </label>

          <input
            className="crm-input"
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

        <div className="crm-form-group">
          <label className="crm-label" htmlFor="opportunity">
            Oportunidad
          </label>

          <select
            className="crm-select"
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
          <div className="crm-form-group">
            <label className="crm-label" htmlFor="client">
              Cliente
            </label>

            <select
              className="crm-select"
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

        <div className="crm-form-group">
          <label className="crm-label" htmlFor="valid-until">
            Vigencia
          </label>

          <input
            className="crm-input"
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

        <div className="crm-form-group">
          <label className="crm-label" htmlFor="currency">
            Moneda
          </label>

          <input
            className="crm-input"
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

        <div className="crm-form-group">
          <label className="crm-label" htmlFor="tax">
            IVA
          </label>

          <input
            className="crm-input"
            id="tax"
            type="text"
            value="16%"
            readOnly
            aria-readonly="true"
          />
        </div>

        <div className="crm-form-group crm-form-group--full">
          <label className="crm-label" htmlFor="notes">
            Notas
          </label>

          <textarea
            className="crm-textarea"
            id="notes"
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value,
              )
            }
          />
        </div>
          </div>
        </section>

       <section className="crm-form-section">
          <div className="crm-panel-title">
              <span className="crm-eyebrow">
                02
              </span>
              <h2 className="crm-text-h2">
                Partidas
              </h2>
              <p className="crm-text-body">
                Agrega los servicios incluidos en la cotización.
              </p>
            </div>
            <div className="crm-panel__actions">
              <button
                type="button"
                className="crm-btn crm-btn--secondary"
                onClick={addItem}
              >
                Agregar servicio
              </button>
            </div>
      

          {items.map((item, index) => (
            <div key={item.key}>
              <strong>
                Servicio {index + 1}
              </strong>

          <div className="crm-form-grid">
              <div className="crm-form-group">
                <label className="crm-label">
                  Servicio
                </label>

                <select
                  className="crm-select"
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

              <div className="crm-form-group">
                <label className="crm-label">
                  Descripción
                </label>

                <input
                  className="crm-input"
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

              <div className="crm-form-group">
                <label className="crm-label">
                  Cantidad
                </label>

                <input
                  className="crm-input"
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

              <div className="crm-form-group">
                <label className="crm-label">
                  Precio unitario
                </label>

                <input
                  className="crm-input"
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

              <div className="crm-form-group">
                <label className="crm-label">
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
                className="crm-btn crm-btn--secondary"
                onClick={() =>
                  removeItem(item.key)
                }
                disabled={
                  items.length === 1
                }
                aria-disabled={
                  items.length === 1
                }
              >
                Eliminar
              </button>
            </div>
            </div>
          ))}
        </section>

        <section className="crm-form-section">
          <div className="crm-panel-title">
              <span className="crm-eyebrow">
                03
              </span>
              <h3 className="crm-text-h2">
                Componentes comerciales
              </h3>
              <p className="crm-text-body">
                Agrega viáticos y otros componentes.
              </p>
            </div>
            <div className="crm-panel__actions">
              <button
                type="button"
                className="crm-btn crm-btn--secondary"
                onClick={addComponent}
                disabled={componentTypes.length === 0}
                aria-disabled={componentTypes.length === 0}
              >
                Agregar viáticos
              </button>
            </div>

          {components.map((component, index) => {
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
              >
                <strong>
                  Viáticos {index + 1}
                </strong>

                <div className='crm-form-grid'>
                <div className="crm-form-group">
                  <label className="crm-label" htmlFor={`component-type-${component.key}`}>
                    Tipo de viáticos
                  </label>
                  <select
                    className="crm-select"
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

                <div className="crm-form-group">
                  <label className="crm-label" htmlFor={`component-treatment-${component.key}`}>
                   Tipo de inciso
                  </label>
                  <select
                    className="crm-select"
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
                      Con viáticos incluidos
                    </option>
                    <option value="ADDITIONAL">
                      Sin viaticos incluidos
                    </option>
                    <option value="INFORMATIVE">
                      Viáticos agregados por volumen
                    </option>
                  </select>
                </div>

                <div className="crm-form-group">
                  <label className="crm-label" htmlFor={`component-amount-${component.key}`}>
                    Importe
                  </label>
                  <input
                    className="crm-input"
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
                  <div className="crm-form-group">
                    <label className="crm-label" htmlFor={`component-clause-${component.key}`}>
                      Cláusula
                    </label>
                    <select
                      className="crm-select"
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
                  <div className="crm-display-sunken">
                    <label className="crm-label">
                      Texto de clausula
                    </label>
                    <span className="crm-text-body">
                      {selectedClause.template_text}
                    </span>
                  </div>
                )}

                
                  <button
                    type="button"
                    className="crm-btn crm-btn--secondary"
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
        
       <section className="crm-form-section">
          <div className="crm-summary">
            <p className="crm-label">
              Subtotal:{' '}
              {subtotal.toFixed(2)}
            </p>

            <p className="crm-text-body">
              IVA:{' '}
              {tax.toFixed(2)}
            </p>

            <p className="crm-text-body">
              Total:{' '}
              {total.toFixed(2)}
            </p>
          </div>
        </section>

        {createMutation.isError && (
          <p
            role="alert"
            className="crm-modal-notice crm-modal-notice--error"
          >
            {getErrorMessage(
              createMutation.error,
            )}
          </p>
        )}

      </div>

      <footer className="crm-panel__footer">
        <div className="crm-panel__actions">
          {onCancel && (
            <button
              type="button"
              className="crm-btn crm-btn--secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            className="crm-btn crm-btn--primary"
            disabled={
              createMutation.isPending ||
              isLoadingDependencies
            }
            aria-disabled={
              createMutation.isPending ||
              isLoadingDependencies
            }
          >
            {createMutation.isPending
              ? 'Creando cotización...'
              : 'Crear cotización'}
          </button>
        </div>
      </footer>
    </form>
  )

  if (prospectId) {
    return formContent
  }

  return formContent
}
