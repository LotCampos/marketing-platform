import "./prospects-page.css"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  createProspect,
  getProspects,
} from '../../../infrastructure/api/commercialApi'

import type {
  CreateProspectInput,
  Prospect,
  ProspectStatus,
} from '../types/commercial'

import ProspectForm from '../components/ProspectForm'

import CommercialTable from '../../../shared/components/CommercialTable'

const STATUS_LABELS: Record<ProspectStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  PROPOSAL: 'Propuesta',
  WON: 'Ganado',
  LOST: 'Perdido',
  CONVERTED: 'Convertido',
}

export default function ProspectsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)

  const query = useQuery({
    queryKey: [
      'commercial',
      'prospects',
    ],
    queryFn: getProspects,
  })

  const createMutation = useMutation({
    mutationFn: (
      data: CreateProspectInput,
    ) => createProspect(data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          'commercial',
          'prospects',
        ],
      })

      setShowForm(false)
    },
  })

  const prospects: Prospect[] =
    query.data?.results ?? []

  const handleSubmit = (
    data: CreateProspectInput,
  ) => {
    createMutation.mutate(data)
  }

  const handleCancel = () => {
    if (createMutation.isPending) {
      return
    }

    setShowForm(false)
  }

  return (
    <div className="prospects-page">

      <header className="prospects-hero">

        <div className="prospects-hero-content">

          <span className="prospects-hero-eyebrow">
            COMERCIAL / PROSPECTOS
          </span>

          <h2>
            Prospectos comerciales
          </h2>

          <p>
            Gestión y seguimiento de prospectos
            comerciales registrados en UI-CADO.
          </p>

        </div>

        <button
          type="button"
          className="prospects-primary-action"
          onClick={() => setShowForm(true)}
          disabled={createMutation.isPending}
        >
          <span aria-hidden="true">
            +
          </span>

          Nuevo prospecto
        </button>

      </header>

      {showForm && (
        <section className="prospect-form-container">

          <ProspectForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isPending={
              createMutation.isPending
            }
          />

        </section>
      )}

      {createMutation.isError && (
        <div
          className="prospects-error"
          role="alert"
        >
          No fue posible crear el prospecto.
          Verifique la información e intente
          nuevamente.
        </div>
      )}

      {query.isError && (
        <div
          className="prospects-error"
          role="alert"
        >
          No fue posible cargar los
          prospectos comerciales.
        </div>
      )}

      <section className="prospects-panel">

        <header className="prospects-panel-header">

          <div>

            <span>
              REGISTRO COMERCIAL
            </span>

            <h3>
              Prospectos registrados
            </h3>

          </div>

          <strong>
            {query.isLoading
              ? 'Cargando'
              : `${query.data?.count ?? 0} registros`}
          </strong>

        </header>

        <CommercialTable
          headers={[
            'Prospecto',
            'Empresa',
            'Contacto',
            'RFC',
            'Origen',
            'Estado',
            'Versión',
          ]}
        >

          {query.isLoading ? (

            <tr>
              <td
                colSpan={7}
                className="empty-state"
              >
                Cargando prospectos...
              </td>
            </tr>

          ) : query.isError ? (

            <tr>
              <td
                colSpan={7}
                className="empty-state"
              >
                No fue posible cargar los
                prospectos.
              </td>
            </tr>

          ) : prospects.length === 0 ? (

            <tr>
              <td
                colSpan={7}
                className="empty-state"
              >
                No existen prospectos
                registrados.
              </td>
            </tr>

          ) : (

            prospects.map((prospect) => (

              <tr
                key={prospect.id}
                onClick={() =>
                  navigate(
                    `/commercial/prospects/${prospect.id}`,
                  )
                }
                className="prospect-row"
              >

                <td className="table-primary">
                  {prospect.prospect_number}
                </td>

                <td className="table-primary">
                  {prospect.business_name}
                </td>

                <td>
                  {prospect.contact_name ?? '—'}
                </td>

                <td>
                  {prospect.rfc ?? '—'}
                </td>

                <td>
                  {prospect.source ?? '—'}
                </td>

                <td>
                  <span className="status-badge">
                    {STATUS_LABELS[
                      prospect.status
                    ] ?? prospect.status}
                  </span>
                </td>

                <td>
                  {prospect.version_lock}
                </td>

              </tr>

            ))

          )}

        </CommercialTable>

      </section>

    </div>
  )
}