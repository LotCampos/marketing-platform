import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'

import {
  assignProspect,
  changeProspectStatus,
  getIdentityUsers,
  getInstallation,
  getOpportunities,
  getProspect,
  getQuotationPdf,
  getQuotations,
} from '../../../infrastructure/api/commercialApi'

import type {
  Installation,
  Opportunity,
  Prospect,
  ProspectStatus,
  Quotation,
} from '../types/commercial'
import type { IdentityUser } from '../../../infrastructure/api/identity/identityApi'

import ProspectInstallationModal from '../components/prospect/ProspectInstallationModal'
import ProspectOpportunityModal from '../components/prospect/ProspectOpportunityModal'
import ProspectQuotationModal from '../components/prospect/ProspectQuotationModal'
import ProspectStatusButton from '../components/prospect/ProspectStatusButton'
import ProspectSummary from '../components/prospect/ProspectSummary'

import './prospects-page.css'

const STATUS_LABELS: Record<ProspectStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  QUOTED: 'Cotizado',
  WON: 'Ganado',
  LOST: 'Perdido',
  CONVERTED: 'Convertido',
}

export default function ProspectDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { prospectId } = useParams<{ prospectId: string }>()

  const [installationModalOpen, setInstallationModalOpen] = useState(false)
  const [opportunityModalOpen, setOpportunityModalOpen] = useState(false)
  const [quotationModalOpen, setQuotationModalOpen] = useState(false)

  const query = useQuery<Prospect>({
    queryKey: ['commercial', 'prospects', prospectId],
    queryFn: () => getProspect(prospectId as string),
    enabled: Boolean(prospectId),
  })

  const usersQuery = useQuery<IdentityUser[]>({
    queryKey: ['identity', 'users'],
    queryFn: async () => {
      const response = await getIdentityUsers()
      return response.results
    },
  })

  const opportunitiesQuery = useQuery({
    queryKey: ['commercial', 'opportunities'],
    queryFn: getOpportunities,
  })

  const quotationsQuery = useQuery({
    queryKey: ['commercial', 'quotations'],
    queryFn: getQuotations,
  })

  const pdfMutation = useMutation({
    mutationFn: (quotationId: string) => getQuotationPdf(quotationId),
    onSuccess: (blob) => {
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    },
  })

  const invalidateProspect = async () => {
    await queryClient.invalidateQueries({ queryKey: ['commercial', 'prospects', prospectId] })
    await queryClient.invalidateQueries({ queryKey: ['commercial', 'prospects'] })
    await queryClient.invalidateQueries({ queryKey: ['commercial', 'opportunities'] })
    await queryClient.invalidateQueries({ queryKey: ['commercial', 'quotations'] })
  }

  const assignMutation = useMutation({
    mutationFn: (assignedTo: string) => assignProspect(prospectId as string, {
      assigned_to: assignedTo,
      expected_version: query.data?.version_lock ?? 0,
    }),
    onSuccess: invalidateProspect,
  })

  const statusMutation = useMutation({
    mutationFn: (status: ProspectStatus) => changeProspectStatus(prospectId as string, {
      status,
      expected_version: query.data?.version_lock ?? 0,
    }),
    onSuccess: invalidateProspect,
  })

  const installationId = query.data?.installation
  const installationQuery = useQuery<Installation>({
    queryKey: ['master', 'installations', installationId],
    queryFn: () => getInstallation(installationId as string),
    enabled: Boolean(installationId),
  })

  if (query.isLoading) {
    return (
      <div className="prospects-page">
        <section className="prospects-panel"><div className="empty-state">Cargando prospecto...</div></section>
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="prospects-page">
        <section className="prospects-panel">
          <div className="prospects-error" role="alert">No fue posible cargar el prospecto.</div>
          <button type="button" className="prospects-primary-action" onClick={() => navigate('/commercial/prospects')}>Volver a prospectos</button>
        </section>
      </div>
    )
  }

  const prospect = query.data
  const opportunityEnabled = prospect.status === 'CONTACTED' || prospect.status === 'QUALIFIED'
  const quotationEnabled = prospect.status === 'QUALIFIED' || prospect.status === 'QUOTED'

  const opportunities: Opportunity[] = opportunitiesQuery.data?.results ?? []
  const quotations: Quotation[] = quotationsQuery.data?.results ?? []

  const prospectOpportunities = opportunities.filter(
    (opportunity) => opportunity.prospect === prospect.id,
  )

  const prospectOpportunityIds = new Set(
    prospectOpportunities.map((opportunity) => opportunity.id),
  )

  const prospectQuotations = quotations
    .filter((quotation) => prospectOpportunityIds.has(quotation.opportunity_id))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )


  return (
    <div className="prospect-detail-page">
      <header className="prospects-hero">
        <div className="prospects-hero-content">
          <span className="prospects-hero-eyebrow">COMERCIAL / PROSPECTOS / EXPEDIENTE</span>
          <h2>{prospect.prospect_number}</h2>
          <p>Expediente comercial de {prospect.business_name || 'prospecto'}.</p>
        </div>
        <div className="prospects-hero-actions">
          <button type="button" className="prospects-primary-action" onClick={() => navigate('/commercial/prospects')}>Volver a prospectos</button>
        </div>
      </header>

      <section className="prospects-panel prospect-overview-panel">
        <header className="prospects-panel-header">
          <div><span>EXPEDIENTE COMERCIAL</span><h3>Información general</h3></div>
          <ProspectStatusButton
            status={prospect.status}
            labels={STATUS_LABELS}
            disabled={statusMutation.isPending}
            onChange={(status) => statusMutation.mutate(status)}
          />
        </header>

        {statusMutation.isError && (
          <div className="prospects-error" role="alert">
            No fue posible cambiar el estado del prospecto. Verifica los datos comerciales requeridos y vuelve a intentarlo.
          </div>
        )}

        <ProspectSummary prospect={prospect} installation={installationQuery.data ?? null} />

        <div className="prospect-responsible-control">
          <strong>Responsable</strong>
          <select
            value={prospect.assigned_to ?? ''}
            disabled={usersQuery.isLoading || usersQuery.isError || assignMutation.isPending}
            onChange={(event) => {
              const assignedTo = event.target.value
              if (assignedTo) assignMutation.mutate(assignedTo)
            }}
            aria-label="Asignar prospecto"
          >
            <option value="">Sin asignar</option>
            {usersQuery.data?.map((user) => <option key={user.id} value={user.id}>{user.full_name}</option>)}
          </select>
        </div>
      </section>

      <section className="prospects-panel prospect-actions-panel">
        <header className="prospects-panel-header">
          <div><span>OPERACIÓN COMERCIAL</span><h3>Acciones del expediente</h3></div>
        </header>

        <div className="prospect-action-grid">
          <button type="button" className="prospect-action-card" onClick={() => setInstallationModalOpen(true)}>
            <span className="prospect-action-icon" aria-hidden="true">+</span>
            <span><strong>Nueva instalación</strong><small>Consultar el proceso de incorporación de una instalación.</small></span>
          </button>

          <button
            type="button"
            className="prospect-action-card"
            disabled={!opportunityEnabled}
            onClick={() => opportunityEnabled && setOpportunityModalOpen(true)}
          >
            <span className="prospect-action-icon" aria-hidden="true">→</span>
            <span><strong>Nueva oportunidad</strong><small>Crear o consultar la oportunidad comercial del prospecto.</small></span>
          </button>

          <button
            type="button"
            className="prospect-action-card"
            disabled={!quotationEnabled}
            onClick={() => quotationEnabled && setQuotationModalOpen(true)}
          >
            <span className="prospect-action-icon" aria-hidden="true">$</span>
            <span><strong>Nueva cotización</strong><small>Preparar una cotización vinculada a una oportunidad.</small></span>
          </button>
        </div>
      </section>

      <section className="prospects-panel prospect-related-panel">
        <header className="prospects-panel-header">
          <div><span>EXPEDIENTE COMERCIAL</span><h3>Cotizaciones</h3></div>
        </header>

        {quotationsQuery.isLoading || opportunitiesQuery.isLoading ? (
          <div className="prospect-related-empty">
            <strong>Cargando cotizaciones...</strong>
            <p>Consultando las cotizaciones vinculadas al expediente comercial.</p>
          </div>
        ) : quotationsQuery.isError || opportunitiesQuery.isError ? (
          <div className="prospects-error" role="alert">
            No fue posible cargar las cotizaciones del prospecto.
          </div>
        ) : prospectQuotations.length === 0 ? (
          <div className="prospect-related-empty">
            <strong>Sin cotizaciones</strong>
            <p>Las cotizaciones creadas para este prospecto aparecerán aquí.</p>
          </div>
        ) : (
          <div className="prospect-quotations-list">
            {prospectQuotations.map((quotation) => (
              <article key={quotation.id} className="prospect-quotation-card">
                <div className="prospect-quotation-header">
                  <div>
                    <span className="prospect-quotation-number">
                      {quotation.quotation_number}
                    </span>
                    <strong>EMITIDA</strong>
                  </div>
                  <button
                    type="button"
                    className="prospect-quotation-pdf"
                    disabled={pdfMutation.isPending}
                    onClick={() => pdfMutation.mutate(quotation.id)}
                  >
                    {pdfMutation.isPending ? 'Generando PDF...' : 'Ver PDF'}
                  </button>
                </div>

                <div className="prospect-quotation-meta">
                  Creada: {new Date(quotation.created_at).toLocaleDateString('es-MX')}
                </div>

                <div className="prospect-quotation-items">
                  {quotation.items.map((item) => (
                    <div key={item.id} className="prospect-quotation-item">
                      <span>
                        {item.description}
                        <small>
                          {item.quantity} × ${Number(item.unit_price).toLocaleString('es-MX')}
                        </small>
                      </span>
                      <strong>${Number(item.line_total).toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</strong>
                    </div>
                  ))}
                </div>

                <div className="prospect-quotation-totals">
                  <div>
                    <span>Subtotal</span>
                    <strong>${Number(quotation.subtotal).toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</strong>
                  </div>
                  <div>
                    <span>IVA 16%</span>
                    <strong>${Number(quotation.tax_amount).toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</strong>
                  </div>
                  <div className="prospect-quotation-total">
                    <span>Total</span>
                    <strong>${Number(quotation.total_amount).toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ProspectInstallationModal prospect={prospect} open={installationModalOpen} onClose={() => setInstallationModalOpen(false)} />
      <ProspectOpportunityModal prospect={prospect} open={opportunityModalOpen} onClose={() => setOpportunityModalOpen(false)} />
      <ProspectQuotationModal prospect={prospect} open={quotationModalOpen} onClose={() => setQuotationModalOpen(false)} />
    </div>
  )
}
