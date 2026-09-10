import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'

import {
  assignProspect,
  changeProspectStatus,
  getIdentityUsers,
  getInstallation,
  getProspect,
} from '../../../infrastructure/api/commercialApi'

import type {
  IdentityUser,
  Installation,
  Prospect,
  ProspectStatus,
} from '../types/commercial'

import ProspectInstallationModal from '../components/prospect/ProspectInstallationModal'
import ProspectQuotationModal from '../components/prospect/ProspectQuotationModal'
import ProspectStatusButton from '../components/prospect/ProspectStatusButton'
import ProspectSummary from '../components/prospect/ProspectSummary'

import './prospects-page.css'

const STATUS_LABELS: Record<ProspectStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  PROPOSAL: 'Propuesta',
  WON: 'Ganado',
  LOST: 'Perdido',
  CONVERTED: 'Convertido',
}

export default function ProspectDetailPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { prospectId } = useParams<{ prospectId: string }>()

  const [installationModalOpen, setInstallationModalOpen] =
    useState(false)

  const [quotationModalOpen, setQuotationModalOpen] =
    useState(false)

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

  const invalidateProspect = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['commercial', 'prospects', prospectId],
    })

    await queryClient.invalidateQueries({
      queryKey: ['commercial', 'prospects'],
    })
  }

  const assignMutation = useMutation({
    mutationFn: (assignedTo: string) =>
      assignProspect(prospectId as string, {
        assigned_to: assignedTo,
        expected_version: query.data?.version_lock ?? 0,
      }),
    onSuccess: invalidateProspect,
  })

  const statusMutation = useMutation({
    mutationFn: (status: ProspectStatus) =>
      changeProspectStatus(prospectId as string, {
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
        <section className="prospects-panel">
          <div className="empty-state">
            Cargando prospecto...
          </div>
        </section>
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="prospects-page">
        <section className="prospects-panel">
          <div className="prospects-error" role="alert">
            No fue posible cargar el prospecto.
          </div>

          <button
            type="button"
            className="prospects-primary-action"
            onClick={() => navigate('/commercial/prospects')}
          >
            Volver a prospectos
          </button>
        </section>
      </div>
    )
  }

  const prospect = query.data

  const opportunityEnabled =
    prospect.status === 'CONTACTED' ||
    prospect.status === 'QUALIFIED'

  const quotationEnabled =
    prospect.status === 'QUALIFIED' ||
    prospect.status === 'PROPOSAL'

  return (
    <div className="prospect-detail-page">
      <header className="prospects-hero">
        <div className="prospects-hero-content">
          <span className="prospects-hero-eyebrow">
            COMERCIAL / PROSPECTOS / EXPEDIENTE
          </span>

          <h2>{prospect.prospect_number}</h2>

          <p>
            Expediente comercial de{' '}
            {prospect.business_name || 'prospecto'}.
          </p>
        </div>

        <div className="prospects-hero-actions">
          <button
            type="button"
            className="prospects-primary-action"
            onClick={() => navigate('/commercial/prospects')}
          >
            Volver a prospectos
          </button>
        </div>
      </header>

      <section className="prospects-panel prospect-overview-panel">
        <header className="prospects-panel-header">
          <div>
            <span>EXPEDIENTE COMERCIAL</span>
            <h3>Información general</h3>
          </div>

          <ProspectStatusButton
            status={prospect.status}
            labels={STATUS_LABELS}
            disabled={statusMutation.isPending}
            onChange={(status) => statusMutation.mutate(status)}
          />
        </header>

        <ProspectSummary
          prospect={prospect}
          installation={installationQuery.data ?? null}
        />

        <div className="prospect-responsible-control">
          <strong>Responsable</strong>

          <select
            value={prospect.assigned_to ?? ''}
            disabled={
              usersQuery.isLoading ||
              usersQuery.isError ||
              assignMutation.isPending
            }
            onChange={(event) => {
              const assignedTo = event.target.value

              if (assignedTo) {
                assignMutation.mutate(assignedTo)
              }
            }}
            aria-label="Asignar prospecto"
          >
            <option value="">Sin asignar</option>

            {usersQuery.data?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="prospects-panel prospect-actions-panel">
        <header className="prospects-panel-header">
          <div>
            <span>OPERACIÓN COMERCIAL</span>
            <h3>Acciones del expediente</h3>
          </div>
        </header>

        <div className="prospect-action-grid">
          <button
            type="button"
            className="prospect-action-card"
            onClick={() => setInstallationModalOpen(true)}
          >
            <span className="prospect-action-icon" aria-hidden="true">
              +
            </span>

            <span>
              <strong>Nueva instalación</strong>
              <small>
                Consultar el proceso de incorporación de una instalación.
              </small>
            </span>
          </button>

          <button
            type="button"
            className="prospect-action-card"
            disabled={!opportunityEnabled}
            onClick={() => {
              if (!opportunityEnabled) {
                return
              }

              navigate('/commercial/opportunities')
            }}
          >
            <span className="prospect-action-icon" aria-hidden="true">
              →
            </span>

            <span>
              <strong>Oportunidad</strong>
              <small>
                La oportunidad se activa mediante el estado comercial.
              </small>
            </span>
          </button>

          <button
            type="button"
            className="prospect-action-card"
            disabled={!quotationEnabled}
            onClick={() => {
              if (!quotationEnabled) {
                return
              }

              setInstallationModalOpen(true)
            }}
          >
            <span className="prospect-action-icon" aria-hidden="true">
              $
            </span>

            <span>
              <strong>Nueva cotización</strong>
              <small>
                Abrir el espacio de cotización del expediente.
              </small>
            </span>
          </button>
        </div>
      </section>

      <section className="prospects-panel prospect-related-panel">
        <header className="prospects-panel-header">
          <div>
            <span>EXPEDIENTE</span>
            <h3>Información relacionada</h3>
          </div>
        </header>

        <div className="prospect-related-empty">
          <strong>
            Sin información relacionada cargada todavía.
          </strong>

          <p>
            Las entidades relacionadas aparecerán aquí conforme formen
            parte del expediente comercial.
          </p>
        </div>
      </section>

      <ProspectInstallationModal
        prospect={prospect}
        open={installationModalOpen}
        onClose={() => setInstallationModalOpen(false)}
      />

      <ProspectQuotationModal
        prospect={prospect}
        open={quotationModalOpen}
        onClose={() => setQuotationModalOpen(false)}
      />
    </div>
  )
}
