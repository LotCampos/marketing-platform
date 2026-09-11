import './commercial-dashboard.css'
import './commercial-pages.css'

import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'

import CommercialKpiCard from '../../../shared/components/CommercialKpiCard'
import CommercialSidebar from '../../../shared/components/CommercialSidebar'
import CommercialTable from '../../../shared/components/CommercialTable'

import {
  getAgreements,
  getIdentityUsers,
  getOpportunities,
  getProspects,
  getQuotations,
  getServiceCatalog,
  getServiceRequests,
} from '../../../infrastructure/api/commercialApi'

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  QUOTED: 'Cotizado',
  WON: 'Ganado',
  LOST: 'Perdido',
  CONVERTED: 'Convertido',
}

const PERIODS = [
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '180', label: 'Últimos 6 meses' },
  { value: '365', label: 'Últimos 12 meses' },
  { value: 'all', label: 'Todo el histórico' },
]

function collectionResults<T>(value: T[] | { results: T[] } | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : value.results ?? []
}

function money(value: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function shortId(value: string | null | undefined) {
  return value ? `${value.slice(0, 8)}…` : '—'
}

function monthKey(dateValue: string) {
  const date = new Date(dateValue)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('es-MX', {
    month: 'short',
  })
}

function ActivityChart({ data }: { data: Array<{ label: string; prospects: number; opportunities: number; quotations: number; agreements: number }> }) {
  const width = 720
  const height = 240
  const padding = { top: 20, right: 20, bottom: 38, left: 34 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(1, ...data.flatMap((item) => [item.prospects, item.opportunities, item.quotations, item.agreements]))

  const series = [
    { key: 'prospects', label: 'Prospectos' },
    { key: 'opportunities', label: 'Oportunidades' },
    { key: 'quotations', label: 'Cotizaciones' },
    { key: 'agreements', label: 'Contratos' },
  ] as const

  const point = (index: number, value: number) => {
    const x = padding.left + (data.length <= 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth)
    const y = padding.top + innerHeight - (value / maxValue) * innerHeight
    return `${x},${y}`
  }

  return (
    <div className="chart-shell">
      <div className="chart-legend">
        {series.map((item) => (
          <span key={item.key} className={`legend-item legend-${item.key}`}>
            <i />{item.label}
          </span>
        ))}
      </div>
      <svg className="activity-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolución de actividad comercial">
        {[0, 0.5, 1].map((ratio) => {
          const y = padding.top + innerHeight * ratio
          return <line key={ratio} x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="chart-grid-line" />
        })}
        {series.map((item) => (
          <polyline
            key={item.key}
            points={data.map((entry, index) => point(index, entry[item.key])).join(' ')}
            className={`chart-line chart-line-${item.key}`}
          />
        ))}
        {data.map((entry, index) => (
          <text key={entry.label} x={padding.left + (data.length <= 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth)} y={height - 12} textAnchor="middle" className="chart-axis-label">
            {entry.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function FunnelChart({ values }: { values: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...values.map((item) => item.value))
  return (
    <div className="funnel-chart">
      {values.map((item) => (
        <div className="funnel-row" key={item.label}>
          <div className="funnel-label">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="funnel-track">
            <div className="funnel-bar" style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusDistribution({ data }: { data: Array<{ label: string; value: number }> }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0))
  let cursor = 0
  const segments = data.map((item) => {
    const start = cursor
    cursor += (item.value / total) * 360
    return `${item.label} ${start}deg ${cursor}deg`
  })

  return (
    <div className="status-chart">
      <div className="status-donut" style={{ background: data.length ? `conic-gradient(${segments.join(', ')})` : 'rgba(255,255,255,.08)' }}>
        <div className="status-donut-center">
          <strong>{total === 1 && !data.length ? 0 : total}</strong>
          <span>prospectos</span>
        </div>
      </div>
      <div className="status-list">
        {data.map((item, index) => (
          <div className="status-list-row" key={item.label}>
            <span className={`status-dot status-dot-${index % 7}`} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CommercialDashboardPage() {
  const [period, setPeriod] = useState('90')
  const [responsible, setResponsible] = useState('all')
  const [service, setService] = useState('all')
  const [status, setStatus] = useState('all')

  const results = useQueries({
    queries: [
      { queryKey: ['commercial', 'service-requests'], queryFn: getServiceRequests },
      { queryKey: ['commercial', 'prospects'], queryFn: getProspects },
      { queryKey: ['commercial', 'opportunities'], queryFn: getOpportunities },
      { queryKey: ['commercial', 'quotations'], queryFn: getQuotations },
      { queryKey: ['commercial', 'agreements'], queryFn: getAgreements },
      { queryKey: ['commercial', 'service-catalog'], queryFn: getServiceCatalog },
      { queryKey: ['commercial', 'identity-users'], queryFn: getIdentityUsers },
    ],
  })

  const [serviceRequests, prospects, opportunities, quotations, agreements, serviceCatalog, identityUsers] = results
  const loading = results.some((result) => result.isLoading)
  const hasError = results.some((result) => result.isError)

  const prospectRows = prospects.data?.results ?? []
  const opportunityRows = opportunities.data?.results ?? []
  const quotationRows = quotations.data?.results ?? []
  const agreementRows = agreements.data?.results ?? []
  const requestRows = serviceRequests.data?.results ?? []
  const services = collectionResults(serviceCatalog.data)
  const users = identityUsers.data?.results ?? []

  const prospectById = useMemo(() => new Map(prospectRows.map((item) => [item.id, item])), [prospectRows])
  const opportunityById = useMemo(() => new Map(opportunityRows.map((item) => [item.id, item])), [opportunityRows])
  const serviceById = useMemo(() => new Map(services.map((item) => [item.id, item])), [services])
  const userById = useMemo(() => new Map(users.map((item) => [item.id, item])), [users])

  const cutoff = useMemo(() => {
    if (period === 'all') return null
    const date = new Date()
    date.setDate(date.getDate() - Number(period))
    return date
  }, [period])

  const withinPeriod = (dateValue: string | null | undefined) => !cutoff || !dateValue || new Date(dateValue) >= cutoff

  const filteredProspects = useMemo(() => prospectRows.filter((item) =>
    withinPeriod(item.created_at) &&
    (responsible === 'all' || item.assigned_to === responsible) &&
    (service === 'all' || item.service_catalog_id === service) &&
    (status === 'all' || item.status === status),
  ), [prospectRows, responsible, service, status, cutoff])

  const filteredOpportunityIds = useMemo(() => new Set(filteredProspects.map((item) => item.id)), [filteredProspects])

  const filteredOpportunities = useMemo(() => opportunityRows.filter((item) => {
    const prospect = item.prospect ? prospectById.get(item.prospect) : null
    const responsibleMatch = responsible === 'all' || item.assigned_to === responsible || prospect?.assigned_to === responsible
    const serviceMatch = service === 'all' || prospect?.service_catalog_id === service
    const statusMatch = status === 'all' || prospect?.status === status
    const relationshipMatch = item.prospect ? filteredOpportunityIds.has(item.prospect) : responsibleMatch && serviceMatch && statusMatch
    return withinPeriod(item.created_at) && responsibleMatch && serviceMatch && statusMatch && relationshipMatch
  }), [opportunityRows, prospectById, filteredOpportunityIds, responsible, service, status, cutoff])

  const filteredOpportunityIdSet = useMemo(() => new Set(filteredOpportunities.map((item) => item.id)), [filteredOpportunities])

  const filteredQuotations = useMemo(() => quotationRows.filter((item) => {
    const opportunity = opportunityById.get(item.opportunity_id)
    const prospect = opportunity?.prospect ? prospectById.get(opportunity.prospect) : null
    const serviceMatch = service === 'all' || item.items.some((line) => line.service_catalog_id === service) || prospect?.service_catalog_id === service
    const responsibleMatch = responsible === 'all' || item.issued_by === responsible || opportunity?.assigned_to === responsible || prospect?.assigned_to === responsible
    const statusMatch = status === 'all' || prospect?.status === status
    return withinPeriod(item.created_at) && filteredOpportunityIdSet.has(item.opportunity_id) && serviceMatch && responsibleMatch && statusMatch
  }), [quotationRows, opportunityById, prospectById, filteredOpportunityIdSet, responsible, service, status, cutoff])

  const filteredAgreements = useMemo(() => agreementRows.filter((item) => {
    const opportunity = opportunityById.get(item.opportunity_id)
    const prospect = opportunity?.prospect ? prospectById.get(opportunity.prospect) : null
    const responsibleMatch = responsible === 'all' || opportunity?.assigned_to === responsible || prospect?.assigned_to === responsible
    const serviceMatch = service === 'all' || prospect?.service_catalog_id === service || quotationRows.find((quotation) => quotation.id === item.quotation_id)?.items.some((line) => line.service_catalog_id === service)
    const statusMatch = status === 'all' || prospect?.status === status
    return withinPeriod(item.created_at) && filteredOpportunityIdSet.has(item.opportunity_id) && responsibleMatch && serviceMatch && statusMatch
  }), [agreementRows, opportunityById, prospectById, quotationRows, filteredOpportunityIdSet, responsible, service, status, cutoff])

  const filteredRequests = useMemo(() => requestRows.filter((item) => withinPeriod(item.created_at)), [requestRows, cutoff])

  const pipelineValue = useMemo(() => filteredOpportunities.reduce((sum, item) => sum + Number(item.estimated_value ?? 0), 0), [filteredOpportunities])
  const quotedValue = useMemo(() => filteredQuotations.reduce((sum, item) => sum + Number(item.total_amount ?? 0), 0), [filteredQuotations])

  const activity = useMemo(() => {
    const keys = new Set<string>()
    const push = (dateValue: string) => keys.add(monthKey(dateValue))
    filteredProspects.forEach((item) => push(item.created_at))
    filteredOpportunities.forEach((item) => push(item.created_at))
    filteredQuotations.forEach((item) => push(item.created_at))
    filteredAgreements.forEach((item) => push(item.created_at))

    const sorted = [...keys].sort()
    const recent = sorted.slice(-6)
    return recent.map((key) => ({
      label: monthLabel(key),
      prospects: filteredProspects.filter((item) => monthKey(item.created_at) === key).length,
      opportunities: filteredOpportunities.filter((item) => monthKey(item.created_at) === key).length,
      quotations: filteredQuotations.filter((item) => monthKey(item.created_at) === key).length,
      agreements: filteredAgreements.filter((item) => monthKey(item.created_at) === key).length,
    }))
  }, [filteredProspects, filteredOpportunities, filteredQuotations, filteredAgreements])

  const statusDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    filteredProspects.forEach((item) => counts.set(item.status, (counts.get(item.status) ?? 0) + 1))
    return [...counts.entries()].map(([key, value]) => ({ label: STATUS_LABELS[key] ?? key, value }))
  }, [filteredProspects])

  const responsiblePerformance = useMemo(() => {
    const counts = new Map<string, { opportunities: number; value: number; quotations: number }>()
    filteredOpportunities.forEach((item) => {
      const key = item.assigned_to ?? 'unassigned'
      const current = counts.get(key) ?? { opportunities: 0, value: 0, quotations: 0 }
      current.opportunities += 1
      current.value += Number(item.estimated_value ?? 0)
      counts.set(key, current)
    })
    filteredQuotations.forEach((item) => {
      const opportunity = opportunityById.get(item.opportunity_id)
      const key = opportunity?.assigned_to ?? item.issued_by ?? 'unassigned'
      const current = counts.get(key) ?? { opportunities: 0, value: 0, quotations: 0 }
      current.quotations += 1
      counts.set(key, current)
    })
    return [...counts.entries()]
      .map(([key, value]) => ({
        name: key === 'unassigned' ? 'Sin asignar' : userById.get(key)?.full_name ?? shortId(key),
        ...value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [filteredOpportunities, filteredQuotations, opportunityById, userById])

  const alerts = useMemo(() => {
    const quotedOpportunityIds = new Set(filteredQuotations.map((item) => item.opportunity_id))
    const today = new Date()
    const withoutQuotation = filteredOpportunities.filter((item) => !quotedOpportunityIds.has(item.id)).length
    const expiring = filteredQuotations.filter((item) => {
      if (!item.valid_until) return false
      const expiry = new Date(`${item.valid_until}T23:59:59`)
      const days = (expiry.getTime() - today.getTime()) / 86400000
      return days >= 0 && days <= 7
    }).length
    const stale = filteredProspects.filter((item) => {
      const days = (today.getTime() - new Date(item.created_at).getTime()) / 86400000
      return days > 14 && !['WON', 'LOST', 'CONVERTED'].includes(item.status)
    }).length
    return { withoutQuotation, expiring, stale }
  }, [filteredOpportunities, filteredQuotations, filteredProspects])

  const latestOpportunities = filteredOpportunities.slice(0, 8)
  const latestRequests = filteredRequests.slice(0, 8)

  return (
    <div className="application-shell">
      <CommercialSidebar />
      <div className="application-main">
        <main className="page-container dashboard-page">
          <header className="page-header">
            <div>
              <p className="eyebrow">CONTROL OPERATIVO</p>
              <h1>Centro de Operaciones Comerciales</h1>
              <p className="page-description">
                Vista ejecutiva del ciclo comercial con indicadores, pipeline económico, actividad y alertas operativas.
              </p>
            </div>
          </header>

          <section className="dashboard-filters" aria-label="Filtros comerciales">
            <label>
              <span>Periodo</span>
              <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                {PERIODS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Responsable</span>
              <select value={responsible} onChange={(event) => setResponsible(event.target.value)}>
                <option value="all">Todos</option>
                {users.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
              </select>
            </label>
            <label>
              <span>Servicio</span>
              <select value={service} onChange={(event) => setService(event.target.value)}>
                <option value="all">Todos</option>
                {services.filter((item) => item.is_active).map((item) => <option key={item.id} value={item.id}>{item.service_name}</option>)}
              </select>
            </label>
            <label>
              <span>Estado</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">Todos</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </section>

          {hasError && <div className="api-error" role="alert">No fue posible consultar uno o más recursos del módulo Comercial.</div>}

          <section className="kpi-grid">
            <CommercialKpiCard label="Solicitudes" value={filteredRequests.length} description="Solicitudes dentro del periodo" />
            <CommercialKpiCard label="Prospectos" value={filteredProspects.length} description="Prospectos filtrados" />
            <CommercialKpiCard label="Oportunidades" value={filteredOpportunities.length} description="Oportunidades activas en vista" />
            <CommercialKpiCard label="Cotizaciones" value={filteredQuotations.length} description="Cotizaciones emitidas" />
            <CommercialKpiCard label="Pipeline" value={money(pipelineValue)} description="Valor estimado de oportunidades" />
            <CommercialKpiCard label="Valor cotizado" value={money(quotedValue)} description="Importe total cotizado" />
            <CommercialKpiCard label="Contratos" value={filteredAgreements.length} description="Acuerdos en el periodo" />
          </section>

          <section className="dashboard-grid dashboard-grid-main">
            <article className="dashboard-panel chart-panel">
              <header className="panel-heading">
                <div><span className="eyebrow">TENDENCIA</span><h2>Actividad comercial</h2></div>
                <strong>{loading ? 'Cargando…' : `${filteredProspects.length + filteredOpportunities.length + filteredQuotations.length + filteredAgreements.length} eventos`}</strong>
              </header>
              <ActivityChart data={activity} />
            </article>

            <article className="dashboard-panel chart-panel">
              <header className="panel-heading">
                <div><span className="eyebrow">CONVERSIÓN</span><h2>Embudo comercial</h2></div>
              </header>
              <FunnelChart values={[
                { label: 'Prospectos', value: filteredProspects.length },
                { label: 'Oportunidades', value: filteredOpportunities.length },
                { label: 'Cotizaciones', value: filteredQuotations.length },
                { label: 'Contratos', value: filteredAgreements.length },
              ]} />
            </article>
          </section>

          <section className="dashboard-grid dashboard-grid-secondary">
            <article className="dashboard-panel chart-panel">
              <header className="panel-heading"><div><span className="eyebrow">DISTRIBUCIÓN</span><h2>Estado de prospectos</h2></div></header>
              <StatusDistribution data={statusDistribution} />
            </article>

            <article className="dashboard-panel chart-panel">
              <header className="panel-heading"><div><span className="eyebrow">RESPONSABLES</span><h2>Rendimiento comercial</h2></div></header>
              <div className="performance-list">
                {responsiblePerformance.length === 0 && <p className="empty-state">Sin datos para los filtros seleccionados.</p>}
                {responsiblePerformance.map((item) => {
                  const max = Math.max(1, ...responsiblePerformance.map((row) => row.value))
                  return (
                    <div className="performance-row" key={item.name}>
                      <div className="performance-head"><span>{item.name}</span><strong>{money(item.value)}</strong></div>
                      <div className="performance-track"><div style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }} /></div>
                      <small>{item.opportunities} oportunidades · {item.quotations} cotizaciones</small>
                    </div>
                  )
                })}
              </div>
            </article>
          </section>

          <section className="dashboard-panel alert-panel">
            <header className="panel-heading"><div><span className="eyebrow">ATENCIÓN OPERATIVA</span><h2>Alertas del pipeline</h2></div></header>
            <div className="alert-grid">
              <div className="alert-card"><strong>{alerts.withoutQuotation}</strong><span>Oportunidades sin cotización</span></div>
              <div className="alert-card"><strong>{alerts.expiring}</strong><span>Cotizaciones por vencer en 7 días</span></div>
              <div className="alert-card"><strong>{alerts.stale}</strong><span>Prospectos sin cierre por más de 14 días</span></div>
            </div>
          </section>

          <section className="dashboard-panel">
            <header className="panel-heading">
              <div><span className="eyebrow">PIPELINE</span><h2>Oportunidades comerciales</h2></div>
              <strong>{latestOpportunities.length} visibles</strong>
            </header>
            <CommercialTable headers={['Oportunidad', 'Título', 'Responsable', 'Valor estimado', 'Prospecto']}>
              {latestOpportunities.map((item) => {
                const prospect = item.prospect ? prospectById.get(item.prospect) : null
                return (
                  <tr key={item.id}>
                    <td className="table-primary">{item.opportunity_number}</td>
                    <td>{item.title}</td>
                    <td>{item.assigned_to ? userById.get(item.assigned_to)?.full_name ?? shortId(item.assigned_to) : 'Sin asignar'}</td>
                    <td>{money(Number(item.estimated_value ?? 0))}</td>
                    <td>{prospect?.business_name ?? '—'}</td>
                  </tr>
                )
              })}
            </CommercialTable>
          </section>

          <section className="dashboard-panel">
            <header className="panel-heading"><div><span className="eyebrow">ACTIVIDAD</span><h2>Solicitudes recientes</h2></div><strong>{latestRequests.length} visibles</strong></header>
            <CommercialTable headers={['Solicitud', 'Solicitante', 'Fecha', 'Descripción']}>
              {latestRequests.map((item) => (
                <tr key={item.id}>
                  <td className="table-primary">{item.request_number}</td>
                  <td>{item.requested_by_name ?? '—'}</td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleDateString('es-MX') : '—'}</td>
                  <td><span className="commercial-table-description">{item.description ?? 'Sin descripción'}</span></td>
                </tr>
              ))}
            </CommercialTable>
          </section>
        </main>
      </div>
    </div>
  )
}
