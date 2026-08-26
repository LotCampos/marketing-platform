import { useState } from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import CommercialHeader from '../../../shared/components/CommercialHeader'
import CommercialSidebar from '../../../shared/components/CommercialSidebar'
import CommercialTable from '../../../shared/components/CommercialTable'

import {
  createServiceRequest,
  getServiceRequests,
} from '../../../infrastructure/api/commercialApi'

import { ServiceRequestForm } from '../components/ServiceRequestForm'

import type { CreateServiceRequestInput } from '../types/commercial'

import '../components/commercial-forms.css'
import './commercial-pages.css'

export default function ServiceRequestsPage() {
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] =
    useState(false)

  const [formError, setFormError] =
    useState<string | null>(null)

  const query = useQuery({
    queryKey: [
      'commercial',
      'service-requests',
    ],
    queryFn: getServiceRequests,
  })

  const mutation = useMutation({
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

      setIsModalOpen(false)
      setFormError(null)
    },

    onError: (error: unknown) => {
      console.error(
        'Error al crear solicitud:',
        error,
      )

      const responseData = (
        error as {
          response?: {
            data?: {
              detail?: string
              client_id?: string[]
              installation_id?: string[]
              service_catalog_id?: string[]
              request_number?: string[]
            }
          }
        }
      )?.response?.data

      const detail =
        responseData?.detail ??
        responseData?.request_number?.[0] ??
        responseData?.client_id?.[0] ??
        responseData?.installation_id?.[0] ??
        responseData?.service_catalog_id?.[0] ??
        'No fue posible crear la solicitud. Verifica los datos capturados.'

      setFormError(detail)
    },
  })

  const handleOpenModal = () => {
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    if (mutation.isPending) {
      return
    }

    setIsModalOpen(false)
    setFormError(null)
  }

  return (
    <div className="application-shell">
      <CommercialSidebar />

      <div className="application-main">
        <CommercialHeader title="Solicitudes Comerciales" />

        <main className="page-container commercial-page">
          <header className="page-header service-request-page-header">
            <div>
              <p className="eyebrow">
                COMERCIAL / SOLICITUDES
              </p>

              <h1>
                Solicitudes de servicio
              </h1>

              <p className="page-description">
                Registro y seguimiento de las
                solicitudes comerciales recibidas.
              </p>
            </div>

            <div className="page-header-actions">
              <button
                type="button"
                onClick={handleOpenModal}
                className="commercial-primary-button"
              >
                Nueva Solicitud
              </button>
            </div>
          </header>

          {/* =====================================================
              MODAL — NUEVA SOLICITUD
          ====================================================== */}

          {isModalOpen && (
            <div
              className="commercial-form-modal"
              aria-labelledby="service-request-modal-title"
              role="dialog"
              aria-modal="true"
            >
              <div
                className="commercial-form-modal-backdrop"
                aria-hidden="true"
                onClick={handleCloseModal}
              />

              <div className="commercial-form-modal-window service-request-modal">
                {/* =================================================
                    HEADER
                ================================================== */}

                <header className="service-request-modal-header">
                  <div className="service-request-modal-header-content">
                    <span className="service-request-modal-eyebrow">
                      MÓDULO COMERCIAL
                    </span>

                    <h2 id="service-request-modal-title">
                      Registrar Nueva Solicitud
                    </h2>

                    <p>
                      Capture la información requerida
                      para registrar la solicitud
                      comercial.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="commercial-form-modal-close"
                    onClick={handleCloseModal}
                    disabled={mutation.isPending}
                    aria-label="Cerrar ventana"
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
                        d="M6 6l12 12M18 6 6 18"
                      />
                    </svg>
                  </button>
                </header>

                {/* =================================================
                    BODY
                ================================================== */}

                <div className="commercial-form-modal-content">
                  <div className="service-request-modal-body">
                    {formError && (
                      <div
                        className="form-alert"
                        role="alert"
                      >
                        <div className="form-alert-icon">
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
                              d="M12 9v4m0 4h.01M10.29 3.86 2.82 17a2 2 0 0 0 1.74 3h14.88a2 2 0 0 0 1.74-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                            />
                          </svg>
                        </div>

                        <div>
                          <strong>
                            No fue posible registrar la solicitud
                          </strong>

                          <p>
                            {formError}
                          </p>
                        </div>
                      </div>
                    )}

                    <ServiceRequestForm
                      onSubmit={(formData) => {
                        setFormError(null)
                        mutation.mutate(formData)
                      }}
                      onCancel={handleCloseModal}
                      isPending={mutation.isPending}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              REGISTROS
          ====================================================== */}

          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>
                Registros
              </h2>

              <span className="record-count">
                {query.data?.count ?? 0} registros
              </span>
            </div>

            {query.isLoading && (
              <div className="page-state">
                Cargando solicitudes...
              </div>
            )}

            {query.isError && (
              <div
                className="api-error"
                role="alert"
              >
                <p>
                  No fue posible cargar las
                  solicitudes de servicio.
                </p>
              </div>
            )}

            {!query.isLoading &&
              !query.isError &&
              (query.data?.results.length ?? 0) ===
                0 && (
                <div className="empty-state-container">
                  <p className="empty-state">
                    No existen solicitudes de servicio
                    registradas.
                  </p>

                  <button
                    type="button"
                    onClick={handleOpenModal}
                    className="commercial-secondary-button"
                  >
                    Crear la primera solicitud
                  </button>
                </div>
              )}

            {!query.isLoading &&
              !query.isError &&
              (query.data?.results.length ?? 0) >
                0 && (
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
                  {(query.data?.results ?? []).map(
                    (item) => (
                      <tr key={item.id}>
                        <td className="table-primary">
                          {item.request_number}
                        </td>

                        <td>
                          {item.requested_by_name ||
                            '-'}
                        </td>

                        <td>
                          {item.requested_by_email ||
                            '-'}
                        </td>

                        <td>
                          {item.requested_by_phone ||
                            '-'}
                        </td>

                        <td>
                          {item.requested_at
                            ? new Date(
                                item.requested_at,
                              ).toLocaleDateString()
                            : '-'}
                        </td>

                        <td>
                          {item.request_description ||
                            '-'}
                        </td>
                      </tr>
                    ),
                  )}
                </CommercialTable>
              )}
          </section>
        </main>
      </div>
    </div>
  )
}