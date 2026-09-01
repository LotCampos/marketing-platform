import "./service-requests-page.css"


import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { useState } from 'react'

import {
  createServiceRequest,
  getServiceRequests,
} from '../../../infrastructure/api/commercialApi'
import { ServiceRequestForm } from '../components/ServiceRequestForm'

import CommercialTable from '../../../shared/components/CommercialTable'

import type {
  CreateServiceRequestInput,
} from '../types/commercial'

export default function ServiceRequestsPage() {
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)

  const query = useQuery({
    queryKey: [
      'commercial',
      'service-requests',
    ],
    queryFn: getServiceRequests,
  })

  const createMutation = useMutation({
    mutationFn: (
      data: CreateServiceRequestInput,
    ) => createServiceRequest(data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          'commercial',
          'service-requests',
        ],
      })

      setShowForm(false)
    },
  })

  const requests =
    query.data?.results ?? []

  const handleSubmit = (
    data: CreateServiceRequestInput,
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
          <div className="service-requests-page">

        <header className="service-requests-hero">
          <div className="service-requests-hero-content">

            <span className="service-requests-hero-eyebrow">
              COMERCIAL / SOLICITUDES
            </span>

            <h2>
              Solicitudes de servicio
            </h2>

            <p>
              Registro, recepción y seguimiento
              de las solicitudes comerciales que
              originan el ciclo operativo de UI-CADO.
            </p>

          </div>

          <button
            type="button"
            className="service-request-primary-action"
            onClick={() => setShowForm(true)}
            disabled={createMutation.isPending}
          >
            <span aria-hidden="true">
              +
            </span>

            Nueva solicitud
          </button>
        </header>

        {showForm && (
          <section className="service-request-form-container">

            <ServiceRequestForm
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
            className="service-requests-error"
            role="alert"
          >
            No fue posible crear la solicitud
            de servicio. Verifique la información
            e intente nuevamente.
          </div>
        )}

        {query.isError && (
          <div
            className="service-requests-error"
            role="alert"
          >
            No fue posible cargar las
            solicitudes comerciales.
          </div>
        )}

        <section className="service-requests-panel">

          <header className="service-requests-panel-header">

            <div>

              <span>
                REGISTRO OPERATIVO
              </span>

              <h3>
                Solicitudes recibidas
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
              'Número',
              'Solicitante',
              'Correo',
              'Teléfono',
              'Fecha',
              'Descripción',
            ]}
          >

            {query.isLoading ? (

              <tr>
                <td
                  colSpan={6}
                  className="empty-state"
                >
                  Cargando solicitudes...
                </td>
              </tr>

            ) : query.isError ? (

              <tr>
                <td
                  colSpan={6}
                  className="empty-state"
                >
                  No fue posible cargar las
                  solicitudes.
                </td>
              </tr>

            ) : requests.length === 0 ? (

              <tr>
                <td
                  colSpan={6}
                  className="empty-state"
                >
                  No existen solicitudes
                  registradas.
                </td>
              </tr>

            ) : (

              requests.map((item) => (

                <tr key={item.id}>

                  <td className="table-primary">
                    {item.request_number}
                  </td>

                  <td>
                    {item.requested_by_name ?? '—'}
                  </td>

                  <td>
                    {item.requested_by_email ?? '—'}
                  </td>

                  <td>
                    {item.requested_by_phone ?? '—'}
                  </td>

                  <td>
                    {item.created_at}
                  </td>

                  <td>
                    <span className="service-request-description">
                      {item.description ?? '—'}
                    </span>
                  </td>

                </tr>

              ))

            )}

          </CommercialTable>

        </section>

      </div>
  )
}