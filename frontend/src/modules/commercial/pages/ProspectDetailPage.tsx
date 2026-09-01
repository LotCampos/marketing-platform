import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  assignProspect,
  changeProspectStatus,
  getIdentityUsers,
  getProspect,
} from '../../../infrastructure/api/commercialApi'
import type {
  IdentityUser,
  Prospect,
  ProspectStatus,
} from '../types/commercial'

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

  const usersQuery = useQuery<IdentityUser[]>({
    queryKey: ['identity', 'users'],
    queryFn: async () => {
      const response = await getIdentityUsers()
      return response.results
    },
  })

  const assignMutation = useMutation({
    mutationFn: (assignedTo: string) =>
      assignProspect(prospectId as string, {
        assigned_to: assignedTo,
        expected_version: query.data?.version_lock ?? 0,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['commercial', 'prospects', prospectId],
      })
      await queryClient.invalidateQueries({
        queryKey: ['commercial', 'prospects'],
      })
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: ProspectStatus) =>
      changeProspectStatus(prospectId as string, {
        status,
        expected_version: query.data?.version_lock ?? 0,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['commercial', 'prospects', prospectId],
      })
      await queryClient.invalidateQueries({
        queryKey: ['commercial', 'prospects'],
      })
    },
  })

  const query = useQuery<Prospect>({
    queryKey: ['commercial', 'prospects', prospectId],
    queryFn: () => getProspect(prospectId as string),
    enabled: Boolean(prospectId),
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

  return (
    <div className="prospects-page">
      <header className="prospects-hero">
        <div className="prospects-hero-content">
          <span className="prospects-hero-eyebrow">
            COMERCIAL / PROSPECTOS / DETALLE
          </span>

          <h2>{prospect.prospect_number}</h2>

          <p>
            Consulta del registro comercial y su información
            operativa.
          </p>
        </div>

        <button
          type="button"
          className="prospects-primary-action"
          onClick={() => navigate('/commercial/prospects')}
        >
          Volver a prospectos
        </button>
      </header>

      <section className="prospects-panel">
        <header className="prospects-panel-header">
          <div>
            <span>REGISTRO COMERCIAL</span>
            <h3>Información del prospecto</h3>
          </div>

          <div>
            <strong>
              {STATUS_LABELS[prospect.status] ?? prospect.status}
            </strong>

            <select
              value={prospect.status}
              disabled={statusMutation.isPending}
              onChange={(event) =>
                statusMutation.mutate(
                  event.target.value as ProspectStatus,
                )
              }
              aria-label="Cambiar estado del prospecto"
            >
              {Object.entries(STATUS_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>
        </header>

        <div className="prospect-detail-grid">
          <div>
            <strong>Asignado a</strong>
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

          <div>
            <strong>Empresa</strong>
            <p>{prospect.business_name || '—'}</p>
          </div>

          <div>
            <strong>RFC</strong>
            <p>{prospect.rfc || '—'}</p>
          </div>

          <div>
            <strong>Contacto</strong>
            <p>{prospect.contact_name || '—'}</p>
          </div>

          <div>
            <strong>Correo electrónico</strong>
            <p>{prospect.contact_email || '—'}</p>
          </div>

          <div>
            <strong>Teléfono</strong>
            <p>{prospect.contact_phone || '—'}</p>
          </div>

          <div>
            <strong>Tipo de instalación</strong>
            <p>
              {prospect.installation_type_detail?.name || '—'}
            </p>
          </div>

          <div>
            <strong>Origen</strong>
            <p>{prospect.source || '—'}</p>
          </div>

          <div>
            <strong>Versión</strong>
            <p>{prospect.version_lock}</p>
          </div>

          <div className="prospect-detail-full">
            <strong>Interés</strong>
            <p>{prospect.interest_description || '—'}</p>
          </div>

          <div className="prospect-detail-full">
            <strong>Notas</strong>
            <p>{prospect.notes || '—'}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
