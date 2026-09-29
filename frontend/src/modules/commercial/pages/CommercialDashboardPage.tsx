import { useQuery } from '@tanstack/react-query'

import CommercialKpiCard from '../../../shared/components/CommercialKpiCard'
import { getCommercialDashboard } from '../../../infrastructure/api/commercialApi'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(Number(value))
}

function formatPeriod(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function maxValue(values: number[]) {
  return Math.max(...values, 1)
}

export default function CommercialDashboardPage() {
  const dashboard = useQuery({
    queryKey: ['commercial', 'dashboard'],
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

  const pipelineByService =
    data?.pipeline_by_service ?? []

  const pipelineByResponsible =
    data?.pipeline_by_responsible ?? []

  const prospectStatus =
    data?.prospect_status ?? []

  const agreementStatus =
    data?.agreement_status ?? []

  const evolution = data?.evolution ?? {
    prospects: [],
    opportunities: [],
    quotations: [],
    agreements: [],
  }

  const evolutionPeriods = Array.from(
    new Set([
      ...evolution.prospects.map(
        (item) => item.period,
      ),
      ...evolution.opportunities.map(
        (item) => item.period,
      ),
      ...evolution.quotations.map(
        (item) => item.period,
      ),
      ...evolution.agreements.map(
        (item) => item.period,
      ),
    ]),
  ).sort()

  const evolutionMax = maxValue([
    ...evolution.prospects.map(
      (item) => item.total,
    ),
    ...evolution.opportunities.map(
      (item) => item.total,
    ),
    ...evolution.quotations.map(
      (item) => item.total,
    ),
    ...evolution.agreements.map(
      (item) => item.total,
    ),
  ])

  const serviceMax = maxValue(
    pipelineByService.map(
      (item) =>
        Number(item.estimated_value),
    ),
  )

  const responsibleMax = maxValue(
    pipelineByResponsible.map(
      (item) =>
        Number(item.estimated_value),
    ),
  )

  const prospectStatusMax = maxValue(
    prospectStatus.map(
      (item) => item.total,
    ),
  )

  const agreementStatusMax = maxValue(
    agreementStatus.map(
      (item) => item.total,
    ),
  )

  return (
   <div className="crm-page-content crm-dashboard-page">
      <header className="crm-panel-hero">
        <div>
              <span className="crm-eyebrow">
                CONTROL COMERCIAL
              </span>

              <h1 className="crm-text-h1">
                Centro de Operaciones Comerciales
              </h1>

              <p className="crm-text-body">
                Visión ejecutiva del ciclo comercial,
                pipeline, prospección y formalización.
              </p>
          </div>
      </header>

          {dashboard.isError && (
            <div
              className="crm-modal-notice crm-modal-notice--error"
              role="alert"
            >
              No fue posible consultar el Dashboard Comercial.
            </div>
          )}

          <section className="crm-kpi-grid">
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
              value={
                data?.kpis.pipeline_estimated_value ?? 0
              }
              description={`${data?.kpis.pipeline_opportunities ?? 0} oportunidades en pipeline`}
            />
          </section>

          <section className="crm-panel">
            <div className="crm-panel__header">
              <div>
                <span className="crm-eyebrow">
                  PIPELINE
                </span>

                <h2 className="crm-text-h2">
                  Pipeline por servicio
                </h2>
              </div>
            </div>

            <div>
              {pipelineByService.map((service) => (
                <div
                  className="crm-dashboard-data-row"
                  key={service.service_id}
                >
                  <div>
                    <strong>
                      {service.service_code ??
                        'SIN CÓDIGO'}
                    </strong>

                    <span>
                      {service.service_name}
                    </span>
                  </div>

                  <div className="crm-progress-track">
                    <div
                      className="crm-progress-fill"
                      style={{
                        width: `${
                          (Number(
                            service.estimated_value,
                          ) /
                            serviceMax) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  <div>
                    <strong>
                      {formatCurrency(
                        Number(
                          service.estimated_value,
                        ),
                      )}
                    </strong>

                    <span>
                      {service.opportunities}{' '}
                      oportunidades
                    </span>
                  </div>
                </div>
              ))}

              {!pipelineByService.length && (
                <p className="crm-text-body">
                  No hay pipeline registrado por servicio.
                </p>
              )}
            </div>
          </section>

          <section className="crm-panel">
            <div className="crm-panel__header">
              <div>
                <span className="crm-eyebrow">
                  FUNNEL COMERCIAL
                </span>

                <h2 className="crm-text-h2">
                  Evolución del expediente comercial
                </h2>
              </div>
            </div>

            <div className="crm-funnel-analysis">
              <div className="crm-funnel-visual">
                <div className="crm-funnel-stage">
                  <span>PROSPECTOS</span>
                  <strong>{funnel.prospects}</strong>
                </div>

                <div className="crm-funnel-stage">
                  <span>OPORTUNIDADES</span>
                  <strong>{funnel.opportunities}</strong>
                </div>

                <div className="crm-funnel-stage">
                  <span>COTIZACIONES</span>
                  <strong>{funnel.quotations}</strong>
                </div>

                <div className="crm-funnel-stage">
                  <span>ACUERDOS</span>
                  <strong>{funnel.agreements}</strong>
                </div>
              </div>

              <div className="crm-summary-grid">
                <div className="crm-dashboard-data-row">
                  <span>
                    Pipeline estimado
                  </span>

                  <strong>
                    {formatCurrency(
                      data?.kpis
                        .pipeline_estimated_value ??
                        0,
                    )}
                  </strong>
                </div>

                <div className="crm-dashboard-data-row">
                  <span>
                    Oportunidades
                  </span>

                  <strong>
                    {data?.kpis
                      .pipeline_opportunities ??
                      0}
                  </strong>
                </div>

                <div className="crm-dashboard-data-row">
                  <span>
                    Acuerdos formalizados
                  </span>

                  <strong>
                    {funnel.agreements}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="crm-panel">
            <div className="crm-panel__header">
              <div>
                <span className="crm-eyebrow">
                  RESPONSABLES
                </span>

                <h2 className="crm-text-h2">
                  Pipeline por responsable
                </h2>
              </div>
            </div>

            <div>
              {pipelineByResponsible.map(
                (responsible) => (
                  <div
                    className="crm-dashboard-data-row"
                    key={
                      responsible.responsible_id ??
                      responsible.responsible_name
                    }
                  >
                    <div>
                      <strong>
                        {responsible.responsible_name}
                      </strong>

                      <span>
                        {responsible.opportunities}{' '}
                        oportunidades
                      </span>
                    </div>

                    <div className="crm-progress-track">
                      <div
                        className="crm-progress-fill"
                        style={{
                          width: `${
                            (Number(
                              responsible.estimated_value,
                            ) /
                              responsibleMax) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <div>
                      <strong>
                        {formatCurrency(
                          Number(
                            responsible.estimated_value,
                          ),
                        )}
                      </strong>
                    </div>
                  </div>
                ),
              )}

              {!pipelineByResponsible.length && (
                <p className="crm-text-body">
                  No hay oportunidades asignadas.
                </p>
              )}
            </div>
          </section>

          <section className="crm-panel">
            <div className="crm-panel__header">
              <div>
                <span className="crm-eyebrow">
                  EVOLUCIÓN
                </span>

                <h2 className="crm-text-h2">
                  Actividad comercial por periodo
                </h2>
              </div>
            </div>

            <div className="crm-evolution-chart">
              <div className="crm-evolution-legend">
                <span>
                  <i className="crm-evolution-dot crm-evolution-dot--prospects" />
                  Prospectos
                </span>

                <span>
                  <i className="crm-evolution-dot crm-evolution-dot--opportunities" />
                  Oportunidades
                </span>

                <span>
                  <i className="crm-evolution-dot crm-evolution-dot--quotations" />
                  Cotizaciones
                </span>

                <span>
                  <i className="crm-evolution-dot crm-evolution-dot--agreements" />
                  Acuerdos
                </span>
              </div>

              <div className="crm-evolution-columns">
                {evolutionPeriods.map((period) => {
                  const prospects =
                    evolution.prospects.find(
                      (item) =>
                        item.period === period,
                    )?.total ?? 0

                  const opportunities =
                    evolution.opportunities.find(
                      (item) =>
                        item.period === period,
                    )?.total ?? 0

                  const quotations =
                    evolution.quotations.find(
                      (item) =>
                        item.period === period,
                    )?.total ?? 0

                  const agreements =
                    evolution.agreements.find(
                      (item) =>
                        item.period === period,
                    )?.total ?? 0

                  return (
                    <div
                      className="crm-evolution-column"
                      key={period}
                      data-total={
                        prospects +
                        opportunities +
                        quotations +
                        agreements
                      }
                    >
                      <div className="crm-evolution-bars">
                        <div
                          className="crm-evolution-bar crm-evolution-bar--prospects"
                          style={{
                            height: `${
                              (prospects /
                                evolutionMax) *
                              100
                            }%`,
                          }}
                          title={`Prospectos: ${prospects}`}
                        />

                        <div
                          className="crm-evolution-bar crm-evolution-bar--opportunities"
                          style={{
                            height: `${
                              (opportunities /
                                evolutionMax) *
                              100
                            }%`,
                          }}
                          title={`Oportunidades: ${opportunities}`}
                        />

                        <div
                          className="crm-evolution-bar crm-evolution-bar--quotations"
                          style={{
                            height: `${
                              (quotations /
                                evolutionMax) *
                              100
                            }%`,
                          }}
                          title={`Cotizaciones: ${quotations}`}
                        />

                        <div
                          className="crm-evolution-bar crm-evolution-bar--agreements"
                          style={{
                            height: `${
                              (agreements /
                                evolutionMax) *
                              100
                            }%`,
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
                <p className="crm-text-body">
                  No hay evolución comercial registrada.
                </p>
              )}
            </div>
          </section>

          <section className="crm-dashboard-two-column">
            <section className="crm-panel">
              <div className="crm-panel__header">
                <div>
                  <span className="crm-eyebrow">
                    PROSPECCIÓN
                  </span>

                  <h2 className="crm-text-h2">
                    Estados de prospectos
                  </h2>
                </div>
              </div>

              <div>
                {prospectStatus.map((item) => (
                  <div
                    className="crm-dashboard-data-row"
                    key={item.status}
                  >
                    <div>
                      <strong>
                        {item.status}
                      </strong>

                      <span>
                        {item.total} registros
                      </span>
                    </div>

                    <div className="crm-progress-track">
                      <div
                        className="crm-progress-fill"
                        style={{
                          width: `${
                            (item.total /
                              prospectStatusMax) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                {!prospectStatus.length && (
                  <p className="crm-text-body">
                    No hay prospectos registrados.
                  </p>
                )}
              </div>
            </section>

            <section className="crm-panel">
              <div className="crm-panel__header">
                <div>
                  <span className="crm-eyebrow">
                    FORMALIZACIÓN
                  </span>

                  <h2 className="crm-text-h2">
                    Estados de acuerdos
                  </h2>
                </div>
              </div>

              <div>
                {agreementStatus.map((item) => (
                  <div
                    className="crm-dashboard-data-row"
                    key={item.status}
                  >
                    <div>
                      <strong>
                        {item.status}
                      </strong>

                      <span>
                        {item.total} registros
                      </span>
                    </div>

                    <div className="crm-progress-track">
                      <div
                        className="crm-progress-fill"
                        style={{
                          width: `${
                            (item.total /
                              agreementStatusMax) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                {!agreementStatus.length && (
                  <p className="crm-text-body">
                    No hay acuerdos registrados.
                  </p>
                )}
              </div>
            </section>
          </section>
        </div>
  )
}