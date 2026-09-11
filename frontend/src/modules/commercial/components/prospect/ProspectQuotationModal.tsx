import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../../../../app/auth/useAuth'
import {
  createQuotation,
  getOpportunities,
  getServiceCatalog,
} from '../../../../infrastructure/api/commercialApi'
import type { CreateQuotationInput, CreateQuotationItemInput, Opportunity, Prospect, ServiceCatalog } from '../../types/commercial'

interface ProspectQuotationModalProps {
  prospect: Prospect
  open: boolean
  onClose: () => void
}

interface DraftItem extends CreateQuotationItemInput { key: string }

function createEmptyItem(): DraftItem {
  return { key: crypto.randomUUID(), service_catalog_id: '', description: '', quantity: 1, unit_price: 0 }
}

function collectionResults<T>(data: T[] | { results: T[] } | undefined): T[] {
  if (!data) return []
  return Array.isArray(data) ? data : data.results
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No fue posible crear la cotización.'
}

export default function ProspectQuotationModal({ prospect, open, onClose }: ProspectQuotationModalProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [quotationNumber, setQuotationNumber] = useState('')
  const [opportunityId, setOpportunityId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [currency, setCurrency] = useState('MXN')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<DraftItem[]>([createEmptyItem()])

  const opportunitiesQuery = useQuery({ queryKey: ['commercial', 'opportunities'], queryFn: getOpportunities, enabled: open })
  const serviceCatalogQuery = useQuery({ queryKey: ['commercial', 'service-catalog'], queryFn: getServiceCatalog, enabled: open })

  const opportunities = useMemo(
    () => collectionResults<Opportunity>(opportunitiesQuery.data).filter((opportunity) => opportunity.prospect === prospect.id),
    [opportunitiesQuery.data, prospect.id],
  )
  const serviceCatalog = useMemo(() => collectionResults<ServiceCatalog>(serviceCatalogQuery.data), [serviceCatalogQuery.data])
  const selectedOpportunity = opportunities.find((item) => item.id === opportunityId)
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0), [items])
  const tax = subtotal * 0.16
  const total = subtotal + tax

  const createMutation = useMutation({
    mutationFn: (data: CreateQuotationInput) => createQuotation(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commercial', 'quotations'] })
      await queryClient.invalidateQueries({ queryKey: ['commercial', 'prospects', prospect.id] })
      resetForm()
      onClose()
    },
  })

  function resetForm() {
    setQuotationNumber('')
    setOpportunityId('')
    setValidUntil('')
    setCurrency('MXN')
    setNotes('')
    setItems([createEmptyItem()])
  }

  function updateItem(key: string, field: keyof CreateQuotationItemInput, value: string) {
    setItems((current) => current.map((item) => item.key === key ? { ...item, [field]: value } : item))
  }

  function handleServiceChange(key: string, serviceCatalogId: string) {
    const service = serviceCatalog.find((item) => item.id === serviceCatalogId)
    setItems((current) => current.map((item) => item.key === key ? { ...item, service_catalog_id: serviceCatalogId, description: service?.service_name ?? '' } : item))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !selectedOpportunity || !quotationNumber.trim()) return

    const payload: CreateQuotationInput = {
      quotation_number: quotationNumber.trim(),
      opportunity_id: selectedOpportunity.id,
      client_id: selectedOpportunity.client_id,
      issued_by: user.id,
      valid_until: validUntil || null,
      currency: currency.trim().toUpperCase(),
      notes: notes.trim() || null,
      items: items.map(({ key, ...item }) => { void key; return item }),
    }
    createMutation.mutate(payload)
  }

  if (!open) return null
  const isLoading = opportunitiesQuery.isLoading || serviceCatalogQuery.isLoading

  return (
    <div className="prospect-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="prospect-modal prospect-modal-large" role="dialog" aria-modal="true" aria-labelledby="prospect-quotation-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="prospect-modal-header">
          <div><span>COMERCIAL / {prospect.prospect_number}</span><h3 id="prospect-quotation-modal-title">Nueva cotización</h3></div>
          <button type="button" className="prospect-modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <div className="prospect-modal-body">
          <p className="prospect-modal-notice">Esta cotización puede emitirse antes de convertir el prospecto en cliente. En ese caso, cliente permanecerá como nulo.</p>
          {isLoading && <p>Cargando oportunidades y servicios...</p>}
          {!isLoading && opportunities.length === 0 && <div className="prospects-error" role="alert">Este prospecto todavía no tiene una oportunidad. Crea primero la oportunidad comercial.</div>}

          {!isLoading && opportunities.length > 0 && (
            <form onSubmit={handleSubmit}>
              <div><label htmlFor="prospect-quotation-number">Número de cotización</label><input id="prospect-quotation-number" value={quotationNumber} onChange={(event) => setQuotationNumber(event.target.value)} placeholder="COT-2026-000007" required /></div>
              <div><label htmlFor="prospect-quotation-opportunity">Oportunidad</label><select id="prospect-quotation-opportunity" value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)} required><option value="">Seleccionar oportunidad</option>{opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.opportunity_number} — {opportunity.title}</option>)}</select></div>
              <div><label htmlFor="prospect-quotation-valid-until">Vigencia</label><input id="prospect-quotation-valid-until" type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></div>
              <div><label htmlFor="prospect-quotation-currency">Moneda</label><input id="prospect-quotation-currency" value={currency} maxLength={3} onChange={(event) => setCurrency(event.target.value.toUpperCase())} required /></div>
              <div><label htmlFor="prospect-quotation-tax">IVA %</label><input id="prospect-quotation-tax" type="number" value="16" readOnly aria-readonly="true" /></div>
              <div><label htmlFor="prospect-quotation-notes">Notas</label><textarea id="prospect-quotation-notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>

              <section>
                <div className="panel-heading"><div><h4>Conceptos</h4></div><button type="button" onClick={() => setItems((current) => [...current, createEmptyItem()])}>Agregar concepto</button></div>
                {items.map((item, index) => (
                  <div key={item.key}>
                    <strong>Concepto {index + 1}</strong>
                    <div><label>Servicio</label><select value={item.service_catalog_id} onChange={(event) => handleServiceChange(item.key, event.target.value)} required><option value="">Seleccionar servicio</option>{serviceCatalog.map((service) => <option key={service.id} value={service.id}>{service.service_code} — {service.service_name}</option>)}</select></div>
                    <div><label>Descripción</label><input value={item.description} onChange={(event) => updateItem(item.key, 'description', event.target.value)} required /></div>
                    <div><label>Cantidad</label><input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateItem(item.key, 'quantity', event.target.value)} required /></div>
                    <div><label>Precio unitario</label><input type="number" min="0" step="1" value={item.unit_price} onChange={(event) => updateItem(item.key, 'unit_price', event.target.value)} required /></div>
                    <div><label>Importe</label><span>{(item.quantity * item.unit_price).toFixed(2)}</span></div>
                    <button type="button" onClick={() => setItems((current) => current.length === 1 ? current : current.filter((entry) => entry.key !== item.key))} disabled={items.length === 1}>Eliminar</button>
                  </div>
                ))}
              </section>

              <div className="prospect-modal-notice">Subtotal: <strong>{subtotal.toFixed(2)}</strong> · IVA: <strong>{tax.toFixed(2)}</strong> · Total: <strong>{total.toFixed(2)} {currency.toUpperCase()}</strong></div>
              {createMutation.isError && <div className="prospects-error" role="alert">{errorMessage(createMutation.error)}</div>}
              <div className="prospect-modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" className="prospects-primary-action" disabled={createMutation.isPending || !user}>{createMutation.isPending ? 'Creando...' : 'Crear cotización'}</button></div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
