import "./commercial-dashboard.css"

import './commercial-pages.css'


import { useQueries } from '@tanstack/react-query'


import CommercialHeader from '../../../shared/components/CommercialHeader'

import CommercialKpiCard from '../../../shared/components/CommercialKpiCard'

import CommercialSidebar from '../../../shared/components/CommercialSidebar'

import CommercialTable from '../../../shared/components/CommercialTable'

import StatusBadge from '../../../shared/components/StatusBadge'


import {
  getAgreements,
  getOpportunities,
  getQuotations,
  getServiceRequests,
} from '../../../infrastructure/api/commercialApi'

export default function CommercialDashboardPage() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['commercial', 'service-requests'],
        queryFn: getServiceRequests,
      },
      {
        queryKey: ['commercial', 'opportunities'],
        queryFn: getOpportunities,
      },
      {
        queryKey: ['commercial', 'quotations'],
        queryFn: getQuotations,
      },
      {
        queryKey: ['commercial', 'agreements'],
        queryFn: getAgreements,
      },
    ],
  })

  const [
    serviceRequests,
    opportunities,
    quotations,
    agreements,
  ] = results

  const loading = results.some(
    (result) => result.isLoading,
  )

  const hasError = results.some(
    (result) => result.isError,
  )

  return (
    <div className="application-shell">
      <CommercialSidebar />

      <div className="application-main">
        <CommercialHeader title="Panel Comercial" />

        <main className="page-container dashboard-page">
          <header className="page-header">
            <div>
              <p className="eyebrow">
                CONTROL OPERATIVO
              </p>

              <h1>
                Centro de Operaciones Comerciales
              </h1>

              <p className="page-description">
                Supervisión centralizada del ciclo
                comercial desde la solicitud hasta la
                formalización contractual.
              </p>
            </div>
          </header>

          {hasError && (
            <div
              className="api-error"
              role="alert"
            >
              No fue posible consultar uno o más
              recursos del módulo Comercial.
            </div>
          )}

          <section className="kpi-grid">
            <CommercialKpiCard
              label="Solicitudes"
              value={
                serviceRequests.data?.count ?? 0
              }
              description="Solicitudes comerciales registradas"
            />

            <CommercialKpiCard
              label="Oportunidades"
              value={
                opportunities.data?.count ?? 0
              }
              description="Oportunidades comerciales"
            />

            <CommercialKpiCard
              label="Cotizaciones"
              value={
                quotations.data?.count ?? 0
              }
              description="Cotizaciones emitidas"
            />

            <CommercialKpiCard
              label="Contratos"
              value={
                agreements.data?.count ?? 0
              }
              description="Acuerdos registrados"
            />
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  PIPELINE
                </span>

                <h2>
                  Oportunidades comerciales
                </h2>
              </div>

              <span className="record-count">
                {loading
                  ? 'Cargando...'
                  : `${
                      opportunities.data?.count ?? 0
                    } registros`}
              </span>
            </div>

            <CommercialTable
              headers={[
                'Oportunidad',
                'Título',
                'Cliente',
                'Valor estimado',
                'Estado',
              ]}
            >
              {(
                opportunities.data?.results ?? []
              )
                .slice(0, 8)
                .map((item) => (
                  <tr key={item.id}>
                    <td className="table-primary">
                      {item.opportunity_number}
                    </td>

                    <td>{item.title}</td>

                    <td>{item.client_id}</td>

                    <td>{item.estimated_value}</td>

                    <td>
                      <StatusBadge value="OPEN" />
                    </td>
                  </tr>
                ))}
            </CommercialTable>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  ACTIVIDAD
                </span>

                <h2>
                  Solicitudes recientes
                </h2>
              </div>
            </div>

            <CommercialTable
              headers={[
                'Solicitud',
                'Solicitante',
                'Fecha',
                'Descripción',
              ]}
            >
              {(
                serviceRequests.data?.results ?? []
              )
                .slice(0, 8)
                .map((item) => (
                  <tr key={item.id}>
                    <td className="table-primary">
                      {item.request_number}
                    </td>

                    <td>
                      {item.requested_by_name}
                    </td>

                    <td>
                      {item.created_at
                        ? new Date(
                            item.created_at,
                          ).toLocaleDateString()
                        : '-'}
                    </td>

                    <td>
                      {item.description}
                    </td>
                  </tr>
                ))}
            </CommercialTable>
          </section>
        </main>
      </div>
    </div>
  )
}
