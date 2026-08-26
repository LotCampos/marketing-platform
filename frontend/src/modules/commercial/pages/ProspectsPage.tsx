import './commercial-pages.css'

import { useState } from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createProspect,
  getProspects,
} from '../../../infrastructure/api/commercialApi'

import type {
  Prospect,
  ProspectStatus,
  CreateProspectInput,
} from '../types/commercial'

import CommercialLayout from '../components/CommercialLayout'
import ProspectForm from '../components/ProspectForm'
import PageContainer from '../../../shared/components/PageContainer'
import CommercialTable from '../../../shared/components/CommercialTable'
import StatusBadge from '../../../shared/components/StatusBadge'

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

  const [showForm, setShowForm] = useState(false)

  const prospectsQuery = useQuery({
    queryKey: ['commercial', 'prospects'],
    queryFn: getProspects,
  })

  const createProspectMutation = useMutation({
    mutationFn: (data: CreateProspectInput) =>
      createProspect(data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['commercial', 'prospects'],
      })

      setShowForm(false)
    },
  })

  const prospects: Prospect[] =
    prospectsQuery.data?.results ?? []

  const handleCreateProspect = (
    data: CreateProspectInput,
  ) => {
    createProspectMutation.mutate(data)
  }

  const handleCancelForm = () => {
    if (createProspectMutation.isPending) {
      return
    }

    setShowForm(false)
  }

  return (
    <CommercialLayout>
      <PageContainer
        title="Prospectos"
        description="Gestión y seguimiento de prospectos comerciales registrados en UI-CADO."
      >
        {/* =====================================================
            HEADER DEL REGISTRO
        ====================================================== */}

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Registro de prospectos</h2>

              <span className="record-count">
                {prospectsQuery.isLoading
                  ? 'Cargando'
                  : `${prospects.length} registros`}
              </span>
            </div>

            <button
              type="button"
              className="commercial-primary-button"
              onClick={() => setShowForm(true)}
              disabled={createProspectMutation.isPending}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 5v14m7-7H5"
                />
              </svg>

              Nuevo prospecto
            </button>
          </div>

          {/* ===================================================
              ERROR DE CREACIÓN
          ==================================================== */}

          {createProspectMutation.isError && (
            <div
              className="commercial-form-error"
              role="alert"
            >
              <strong>
                No fue posible crear el prospecto.
              </strong>

              <span>
                Verifique la información e intente nuevamente.
              </span>
            </div>
          )}

          {/* ===================================================
              TABLA
          ==================================================== */}

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
            emptyMessage="No existen prospectos registrados."
          >
            {prospectsQuery.isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="empty-state"
                >
                  Cargando prospectos...
                </td>
              </tr>
            ) : prospectsQuery.isError ? (
              <tr>
                <td
                  colSpan={7}
                  className="empty-state"
                >
                  No fue posible cargar los prospectos.
                </td>
              </tr>
            ) : prospects.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="empty-state"
                >
                  No existen prospectos registrados.
                </td>
              </tr>
            ) : (
              prospects.map((prospect) => (
                <tr key={prospect.id}>
                  <td>
                    <span className="table-primary">
                      {prospect.prospect_number}
                    </span>
                  </td>

                  <td>
                    <span className="table-primary">
                      {prospect.business_name}
                    </span>
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
                    <StatusBadge
                      value={
                        STATUS_LABELS[
                          prospect.status
                        ]
                      }
                    />
                  </td>

                  <td>
                    {prospect.version_lock}
                  </td>
                </tr>
              ))
            )}
          </CommercialTable>
        </section>

        {/* =====================================================
            FORMULARIO NUEVO PROSPECTO
        ====================================================== */}

        {showForm && (
          <div
            className="prospect-form-floating"
            role="dialog"
            aria-modal="true"
            aria-label="Nuevo prospecto"
          >
            <ProspectForm
              onSubmit={handleCreateProspect}
              onCancel={handleCancelForm}
              isPending={
                createProspectMutation.isPending
              }
            />
          </div>
        )}
      </PageContainer>
    </CommercialLayout>
  )
}