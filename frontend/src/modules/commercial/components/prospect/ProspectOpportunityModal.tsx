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

function collectionResults<T>(
  data: T[] | { results: T[] } | undefined,
): T[] {
  if (!data) return []
  return Array.isArray(data) ? data : data.results
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No fue posible crear la oportunidad.'
}

export default function ProspectOpportunityModal({
  prospect,
  open,
  onClose,
}: ProspectOpportunityModalProps) {
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
    () =>
      collectionResults<Opportunity>(
        opportunitiesQuery.data,
      ).filter(
        (opportunity) =>
          opportunity.prospect === prospect.id,
      ),
    [opportunitiesQuery.data, prospect.id],
  )

  const createMutation = useMutation({
    mutationFn: () =>
      createOpportunity({
        opportunity_number: opportunityNumber.trim(),
        prospect: prospect.id,
        assigned_to: user?.id ?? null,
        title: title.trim(),
        description: description.trim() || null,
        estimated_value: estimatedValue.trim() || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['commercial', 'opportunities'],
      })

      await queryClient.invalidateQueries({
        queryKey: ['commercial', 'prospects', prospect.id],
      })

      setOpportunityNumber('')
      setTitle('')
      setDescription('')
      setEstimatedValue('')
      onClose()
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !user ||
      !opportunityNumber.trim() ||
      !title.trim()
    ) {
      return
    }

    createMutation.mutate()
  }

  if (!open) {
    return null
  }

  const submitting = createMutation.isPending

  return (
    <div
      className="crm-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="crm-modal crm-modal--large"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prospect-opportunity-modal-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="crm-modal__header">
          <div>
            <span className="crm-eyebrow">
              COMERCIAL / {prospect.prospect_number}
            </span>

            <h3
              id="prospect-opportunity-modal-title"
              className="crm-text-h2"
            >
              Nueva oportunidad
            </h3>
          </div>

          <button
            type="button"
            className="crm-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="crm-modal__body">
          {relatedOpportunities.length > 0 && (
            <div className="crm-modal-notice">
              <strong>Oportunidades existentes</strong>

              {relatedOpportunities.map(
                (opportunity) => (
                  <div key={opportunity.id}>
                    {opportunity.opportunity_number} —{' '}
                    {opportunity.title}
                  </div>
                ),
              )}
            </div>
          )}

          <p className="crm-text-body">
            La oportunidad conservará al prospecto como
            origen hasta su conversión a cliente.
          </p>

          <form
            onSubmit={handleSubmit}
            className="crm-form-grid"
          >
            <label
              className="crm-form-group"
              htmlFor="prospect-opportunity-number"
            >
              <span className="crm-label">
                Número de oportunidad
              </span>

              <input
                className="crm-input"
                id="prospect-opportunity-number"
                value={opportunityNumber}
                onChange={(event) =>
                  setOpportunityNumber(
                    event.target.value,
                  )
                }
                placeholder="OPP-2026-000007"
                disabled={submitting}
                required
              />
            </label>

            <label
              className="crm-form-group"
              htmlFor="prospect-opportunity-title"
            >
              <span className="crm-label">
                Título
              </span>

              <input
                className="crm-input"
                id="prospect-opportunity-title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder={`Servicio para ${prospect.business_name}`}
                disabled={submitting}
                required
              />
            </label>

            <label
              className="crm-form-group crm-form-group--full"
              htmlFor="prospect-opportunity-description"
            >
              <span className="crm-label">
                Descripción
              </span>

              <textarea
                className="crm-textarea"
                id="prospect-opportunity-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                disabled={submitting}
              />
            </label>

            <label
              className="crm-form-group"
              htmlFor="prospect-opportunity-value"
            >
              <span className="crm-label">
                Valor estimado
              </span>

              <input
                className="crm-input"
                id="prospect-opportunity-value"
                type="number"
                min="0"
                step="0.01"
                value={estimatedValue}
                onChange={(event) =>
                  setEstimatedValue(
                    event.target.value,
                  )
                }
                disabled={submitting}
              />
            </label>

            {createMutation.isError && (
              <div
                className="crm-modal-notice crm-modal-notice--error crm-form-group--full"
                role="alert"
              >
                {errorMessage(createMutation.error)}
              </div>
            )}

            <div className="crm-form-actions crm-form-group--full">
              <button
                type="button"
                className="crm-btn crm-btn--secondary"
                onClick={onClose}
                disabled={submitting}
                aria-disabled={submitting}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="crm-btn crm-btn--primary"
                disabled={submitting || !user}
                aria-disabled={
                  submitting || !user
                }
              >
                {submitting
                  ? 'Creando...'
                  : 'Crear oportunidad'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}