import "./commercial-dashboard.css"
import "./commercial-pages.css"

import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"

import CommercialKpiCard from "../../../shared/components/CommercialKpiCard"
import CommercialSidebar from "../../../shared/components/CommercialSidebar"
import { getCommercialDashboard } from "../../../infrastructure/api/commercialApi"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(value))
}

function formatPeriod(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function maxValue(values: number[]) {
  return Math.max(...values, 1)
}

export default function CommercialDashboardPage() {
  const dashboard = useQuery({
    queryKey: ["commercial", "dashboard"],
    queryFn: getCommercialDashboard,
    refetchInterval: 30_000,
  })

  const data = dashboard.data

  const funnel = data?.funnel ?? {
    prospects: 0,
    opportunities: 0,
    quotations: 0,
    agreements: 0,
  }

  const pipelineByService = data?.pipeline_by_service ?? []
  const pipelineByResponsible = data?.pipeline_by_responsible ?? []
  const prospectStatus = data?.prospect_status ?? []
  const agreementStatus = data?.agreement_status ?? []

  const evolution = data?.evolution ?? {
    prospects: [],
    opportunities: [],
    quotations: [],
    agreements: [],
  }

  const evolutionPeriods = Array.from(
    new Set([
      ...evolution.prospects.map((item) => item.period),
      ...evolution.opportunities.map((item) => item.period),
      ...evolution.quotations.map((item) => item.period),
      ...evolution.agreements.map((item) => item.period),
    ]),
  ).sort()

  const evolutionMax = maxValue([
    ...evolution.prospects.map((item) => item.total),
    ...evolution.opportunities.map((item) => item.total),
    ...evolution.quotations.map((item) => item.total),
    ...evolution.agreements.map((item) => item.total),
  ])

  const serviceMax = maxValue(
    pipelineByService.map((item) => Number(item.estimated_value)),
  )

  const responsibleMax = maxValue(
    pipelineByResponsible.map((item) => Number(item.estimated_value)),
  )

  const prospectStatusMax = maxValue(
    prospectStatus.map((item) => item.total),
  )

  const agreementStatusMax = maxValue(
    agreementStatus.map((item) => item.total),
  )

  return (
    <div className="application-shell">
      <CommercialSidebar />

      <div className="application-main">
        <main className="page-container dashboard-page">
          <header className="dashboard-hero">
            <div className="dashboard-hero-content">
              <span className="dashboard-hero-eyebrow">
                CONTROL COMERCIAL
              </span>

              <h1>
                Centro de Operaciones Comerciales
              </h1>

              <p>
                Visión ejecutiva del ciclo comercial,
                pipeline, prospección y formalización.
              </p>
            </div>

            <div className="quick-actions">
              <Link
                to="/commercial/prospects"
                className="quick-action"
              >
                <strong>+ Nuevo Prospecto</strong>
              </Link>

              <Link
                to="/commercial/opportunities"
                className="quick-action"
              >
                <strong>+ Nueva Oportunidad</strong>
              </Link>

              <Link
                to="/commercial/quotations"
                className="quick-action"
              >
                <strong>+ Nueva Cotización</strong>
              </Link>
            </div>
          </header>

          {dashboard.isError && (
            <div
              className="api-error"
              role="alert"
            >
              No fue posible consultar el Dashboard Comercial.
            </div>
          )}

          <section className="kpi-grid">
            <CommercialKpiCard
              label="Prospectos"
              value={data?.kpis.prospects ?? 0}
              description="Prospectos registrados"
            />

            <CommercialKpiCard
              label="Oportunidades"
              value={data?.kpis.opportunities ?? 0}
              description="Oportunidades comerciales"
            />

            <CommercialKpiCard
              label="Cotizaciones"
              value={data?.kpis.quotations ?? 0}
              description="Cotizaciones emitidas"
            />

            <CommercialKpiCard
              label="Acuerdos"
              value={data?.kpis.agreements ?? 0}
              description="Acuerdos formalizados"
            />

            <CommercialKpiCard
              label="Pipeline"
              value={data?.kpis.pipeline_estimated_value ?? 0}
              description={`${data?.kpis.pipeline_opportunities ?? 0} oportunidades en pipeline`}
            />
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <span>PIPELINE</span>
                <h2>Pipeline por servicio</h2>
              </div>
            </div>

            <div className="dashboard-chart-list">
              {pipelineByService.map((service) => (
                <div
                  className="dashboard-chart-row"
                  key={service.service_id}
                >
                  <div className="dashboard-chart-label">
                    <strong>
                      {service.service_code ?? "SIN CÓDIGO"}
                    </strong>
                    <span>
                      {service.service_name}
                    </span>
                  </div>

                  <div className="dashboard-chart-track">
                    <div
                      className="dashboard-chart-fill"
                      style={{
                        width: `${(
                          Number(service.estimated_value) /
                          serviceMax
                        ) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="dashboard-chart-value">
                    <strong>
                      {formatCurrency(
                        Number(service.estimated_value),
                      )}
                    </strong>
                    <span>
                      {service.opportunities} oportunidades
                    </span>
                  </div>
                </div>
              ))}

              {!pipelineByService.length && (
                <p className="empty-state">
                  No hay pipeline registrado por servicio.
                </p>
              )}
            </div>
          </section>

          <section className="dashboard-panel dashboard-analysis-panel">
            <div className="dashboard-panel-header">
              <div>
                <span>FUNNEL COMERCIAL</span>
                <h2>
                  Evolución del expediente comercial
                </h2>
              </div>
            </div>

            <div className="funnel-analysis-grid">
              <div className="funnel-visual">
                <div className="funnel-stage">
                  <span>PROSPECTOS</span>
                  <strong>{funnel.prospects}</strong>
                </div>

                <div className="funnel-stage">
                  <span>OPORTUNIDADES</span>
                  <strong>{funnel.opportunities}</strong>
                </div>

                <div className="funnel-stage">
                  <span>COTIZACIONES</span>
                  <strong>{funnel.quotations}</strong>
                </div>

                <div className="funnel-stage">
                  <span>ACUERDOS</span>
                  <strong>{funnel.agreements}</strong>
                </div>
              </div>

              <div className="funnel-summary">
                <div>
                  <span>Pipeline estimado</span>
                  <strong>
                    {formatCurrency(
                      data?.kpis.pipeline_estimated_value ?? 0,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Oportunidades</span>
                  <strong>
                    {data?.kpis.pipeline_opportunities ?? 0}
                  </strong>
                </div>

                <div>
                  <span>Acuerdos formalizados</span>
                  <strong>
                    {funnel.agreements}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <span>RESPONSABLES</span>
                <h2>Pipeline por responsable</h2>
              </div>
            </div>

            <div className="dashboard-chart-list">
              {pipelineByResponsible.map((responsible) => (
                <div
                  className="dashboard-chart-row"
                  key={
                    responsible.responsible_id ??
                    responsible.responsible_name
                  }
                >
                  <div className="dashboard-chart-label">
                    <strong>
                      {responsible.responsible_name}
                    </strong>
                    <span>
                      {responsible.opportunities} oportunidades
                    </span>
                  </div>

                  <div className="dashboard-chart-track">
                    <div
                      className="dashboard-chart-fill"
                      style={{
                        width: `${(
                          Number(responsible.estimated_value) /
                          responsibleMax
                        ) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="dashboard-chart-value">
                    <strong>
                      {formatCurrency(
                        Number(responsible.estimated_value),
                      )}
                    </strong>
                  </div>
                </div>
              ))}

              {!pipelineByResponsible.length && (
                <p className="empty-state">
                  No hay oportunidades asignadas.
                </p>
              )}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <span>EVOLUCIÓN</span>
                <h2>Actividad comercial por periodo</h2>
              </div>
            </div>

            <div className="evolution-chart">
              <div className="evolution-legend">
                <span>
                  <i className="evolution-dot prospects" />
                  Prospectos
                </span>
                <span>
                  <i className="evolution-dot opportunities" />
                  Oportunidades
                </span>
                <span>
                  <i className="evolution-dot quotations" />
                  Cotizaciones
                </span>
                <span>
                  <i className="evolution-dot agreements" />
                  Acuerdos
                </span>
              </div>

              <div className="evolution-columns">
                {evolutionPeriods.map((period) => {
                  const prospects =
                    evolution.prospects.find(
                      (item) => item.period === period,
                    )?.total ?? 0

                  const opportunities =
                    evolution.opportunities.find(
                      (item) => item.period === period,
                    )?.total ?? 0

                  const quotations =
                    evolution.quotations.find(
                      (item) => item.period === period,
                    )?.total ?? 0

                  const agreements =
                    evolution.agreements.find(
                      (item) => item.period === period,
                    )?.total ?? 0

                  return (
                    <div
                      className="evolution-column"
                      key={period}
                    >
                      <div className="evolution-bars">
                        <div
                          className="evolution-bar prospects"
                          style={{
                            height: `${(prospects / evolutionMax) * 100}%`,
                          }}
                          title={`Prospectos: ${prospects}`}
                        />

                        <div
                          className="evolution-bar opportunities"
                          style={{
                            height: `${(opportunities / evolutionMax) * 100}%`,
                          }}
                          title={`Oportunidades: ${opportunities}`}
                        />

                        <div
                          className="evolution-bar quotations"
                          style={{
                            height: `${(quotations / evolutionMax) * 100}%`,
                          }}
                          title={`Cotizaciones: ${quotations}`}
                        />

                        <div
                          className="evolution-bar agreements"
                          style={{
                            height: `${(agreements / evolutionMax) * 100}%`,
                          }}
                          title={`Acuerdos: ${agreements}`}
                        />
                      </div>

                      <span>
                        {formatPeriod(period)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {!evolutionPeriods.length && (
                <p className="empty-state">
                  No hay evolución comercial registrada.
                </p>
              )}
            </div>
          </section>

          <section className="dashboard-two-column">
            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span>PROSPECCIÓN</span>
                  <h2>Estados de prospectos</h2>
                </div>
              </div>

              <div className="dashboard-chart-list">
                {prospectStatus.map((item) => (
                  <div
                    className="status-chart-row"
                    key={item.status}
                  >
                    <div>
                      <strong>{item.status}</strong>
                      <span>{item.total} registros</span>
                    </div>

                    <div className="status-chart-track">
                      <div
                        className="status-chart-fill"
                        style={{
                          width: `${(
                            item.total /
                            prospectStatusMax
                          ) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                {!prospectStatus.length && (
                  <p className="empty-state">
                    No hay prospectos registrados.
                  </p>
                )}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <span>FORMALIZACIÓN</span>
                  <h2>Estados de acuerdos</h2>
                </div>
              </div>

              <div className="dashboard-chart-list">
                {agreementStatus.map((item) => (
                  <div
                    className="status-chart-row"
                    key={item.status}
                  >
                    <div>
                      <strong>{item.status}</strong>
                      <span>{item.total} registros</span>
                    </div>

                    <div className="status-chart-track">
                      <div
                        className="status-chart-fill"
                        style={{
                          width: `${(
                            item.total /
                            agreementStatusMax
                          ) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                {!agreementStatus.length && (
                  <p className="empty-state">
                    No hay acuerdos registrados.
                  </p>
                )}
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  )
}
