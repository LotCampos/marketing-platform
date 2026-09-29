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
  QUOTED: 'Cotizado',
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
    <main className="crm-page-content">
      <header className="crm-page-header">
        <div className="crm-page-header__content">
          <p className="crm-eyebrow">
            COMERCIAL / PROSPECTOS
          </p>

          <h1 className="crm-text-h1">
            Prospectos comerciales
          </h1>

          <p className="crm-text-body">
            Gestión y seguimiento de prospectos
            comerciales registrados en UI-CADO.
          </p>
        </div>

        <div className="crm-page-header__actions">
          <button
            type="button"
            className="crm-btn crm-btn--primary"
            onClick={() =>
              setShowForm((value) => !value)
            }
            disabled={createMutation.isPending}
            aria-disabled={createMutation.isPending}
          >
            {showForm
              ? 'Cancelar'
              : 'Nuevo prospecto'}
          </button>
        </div>
      </header>

      <div className="crm-page-body">
        {showForm && (
          <section className="crm-panel">
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
            className="crm-modal-notice crm-modal-notice--error"
            role="alert"
          >
            No fue posible crear el prospecto.
            Verifique la información e intente
            nuevamente.
          </div>
        )}

        {query.isError && (
          <div
            className="crm-modal-notice crm-modal-notice--error"
            role="alert"
          >
            No fue posible cargar los
            prospectos comerciales.
          </div>
        )}

        <section className="crm-panel">
          <header className="crm-panel__header">
            <div className="crm-panel__heading">
              <span className="crm-eyebrow">
                REGISTRO COMERCIAL
              </span>

              <h2 className="crm-panel__title">
                Prospectos registrados
              </h2>
            </div>

            <div className="crm-panel__meta">
              {query.isLoading
                ? 'Cargando'
                : `${query.data?.count ?? 0} registros`}
            </div>
          </header>

          <div className="crm-panel__body">
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
                <tr className="crm-table__tr">
                  <td
                    colSpan={7}
                    className="crm-table__td"
                  >
                    Cargando prospectos...
                  </td>
                </tr>
              ) : query.isError ? (
                <tr className="crm-table__tr">
                  <td
                    colSpan={7}
                    className="crm-table__td"
                  >
                    No fue posible cargar los
                    prospectos.
                  </td>
                </tr>
              ) : prospects.length === 0 ? (
                <tr className="crm-table__tr">
                  <td
                    colSpan={7}
                    className="crm-table__td"
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
                    className="crm-table__tr crm-table__tr--clickable"
                  >
                    <td className="crm-table__td crm-table__td--primary">
                      {prospect.prospect_number}
                    </td>

                    <td className="crm-table__td crm-table__td--primary">
                      {prospect.business_name}
                    </td>

                    <td className="crm-table__td">
                      {prospect.contact_name ?? '—'}
                    </td>

                    <td className="crm-table__td">
                      {prospect.rfc ?? '—'}
                    </td>

                    <td className="crm-table__td">
                      {prospect.source ?? '—'}
                    </td>

                    <td className="crm-table__td">
                      <span className="crm-badge crm-badge--orange">
                        {STATUS_LABELS[
                          prospect.status
                        ] ?? prospect.status}
                      </span>
                    </td>

                    <td className="crm-table__td">
                      {prospect.version_lock}
                    </td>
                  </tr>
                ))
              )}
            </CommercialTable>
          </div>
        </section>
      </div>
    </main>
  )
}
