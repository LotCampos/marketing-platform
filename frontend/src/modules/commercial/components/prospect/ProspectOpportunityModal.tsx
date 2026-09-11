import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../../../../app/auth/useAuth'
import {
  createOpportunity,
  getOpportunities,
} from '../../../../infrastructure/api/commercialApi'
import type { Opportunity, Prospect } from '../../types/commercial'

interface ProspectOpportunityModalProps {
  prospect: Prospect
  open: boolean
  onClose: () => void
}

function collectionResults<T>(data: T[] | { results: T[] } | undefined): T[] {
  if (!data) return []
  return Array.isArray(data) ? data : data.results
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No fue posible crear la oportunidad.'
}

export default function ProspectOpportunityModal({ prospect, open, onClose }: ProspectOpportunityModalProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [opportunityNumber, setOpportunityNumber] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [estimatedValue, setEstimatedValue] = useState('')

  const opportunitiesQuery = useQuery({
    queryKey: ['commercial', 'opportunities'],
    queryFn: getOpportunities,
    enabled: open,
  })

  const relatedOpportunities = useMemo(
    () => collectionResults<Opportunity>(opportunitiesQuery.data).filter((opportunity) => opportunity.prospect === prospect.id),
    [opportunitiesQuery.data, prospect.id],
  )

  const createMutation = useMutation({
    mutationFn: () => createOpportunity({
      opportunity_number: opportunityNumber.trim(),
      prospect: prospect.id,
      assigned_to: user?.id ?? null,
      title: title.trim(),
      description: description.trim() || null,
      estimated_value: estimatedValue.trim() || null,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commercial', 'opportunities'] })
      await queryClient.invalidateQueries({ queryKey: ['commercial', 'prospects', prospect.id] })
      setOpportunityNumber('')
      setTitle('')
      setDescription('')
      setEstimatedValue('')
      onClose()
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !opportunityNumber.trim() || !title.trim()) return
    createMutation.mutate()
  }

  if (!open) return null

  return (
    <div className="prospect-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="prospect-modal prospect-modal-large" role="dialog" aria-modal="true" aria-labelledby="prospect-opportunity-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="prospect-modal-header">
          <div>
            <span>COMERCIAL / {prospect.prospect_number}</span>
            <h3 id="prospect-opportunity-modal-title">Nueva oportunidad</h3>
          </div>
          <button type="button" className="prospect-modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <div className="prospect-modal-body">
          {relatedOpportunities.length > 0 && (
            <div className="prospect-modal-notice">
              <strong>Oportunidades existentes</strong>
              {relatedOpportunities.map((opportunity) => <div key={opportunity.id}>{opportunity.opportunity_number} — {opportunity.title}</div>)}
            </div>
          )}

          <p>La oportunidad conservará al prospecto como origen hasta su conversión a cliente.</p>

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="prospect-opportunity-number">Número de oportunidad</label>
              <input id="prospect-opportunity-number" value={opportunityNumber} onChange={(event) => setOpportunityNumber(event.target.value)} placeholder="OPP-2026-000007" required />
            </div>

            <div>
              <label htmlFor="prospect-opportunity-title">Título</label>
              <input id="prospect-opportunity-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`Servicio para ${prospect.business_name}`} required />
            </div>

            <div>
              <label htmlFor="prospect-opportunity-description">Descripción</label>
              <textarea id="prospect-opportunity-description" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>

            <div>
              <label htmlFor="prospect-opportunity-value">Valor estimado</label>
              <input id="prospect-opportunity-value" type="number" min="0" step="0.01" value={estimatedValue} onChange={(event) => setEstimatedValue(event.target.value)} />
            </div>

            {createMutation.isError && <div className="prospects-error" role="alert">{errorMessage(createMutation.error)}</div>}

            <div className="prospect-modal-actions">
              <button type="button" onClick={onClose}>Cancelar</button>
              <button type="submit" className="prospects-primary-action" disabled={createMutation.isPending || !user}>
                {createMutation.isPending ? 'Creando...' : 'Crear oportunidad'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
