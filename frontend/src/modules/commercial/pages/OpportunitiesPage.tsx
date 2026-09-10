import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import './opportunities-page.css'

import {
  getOpportunities,
  getProspects,
} from '../../../infrastructure/api/commercialApi'

import type {
  CommercialCollection,
  Opportunity,
  Prospect,
} from '../types/commercial'

function collectionResults<T>(
  data: T[] | CommercialCollection<T> | undefined,
): T[] {
  if (!data) {
    return []
  }

  return Array.isArray(data) ? data : data.results
}

export default function OpportunitiesPage() {
  const opportunitiesQuery = useQuery({
    queryKey: ['commercial', 'opportunities'],
    queryFn: getOpportunities,
  })

  const prospectsQuery = useQuery({
    queryKey: ['commercial', 'prospects'],
    queryFn: getProspects,
  })

  const opportunities = useMemo(
    () => collectionResults<Opportunity>(opportunitiesQuery.data),
    [opportunitiesQuery.data],
  )

  const prospectsById = useMemo(
    () =>
      new Map(
        collectionResults<Prospect>(prospectsQuery.data).map(
          (prospect) => [prospect.id, prospect],
        ),
      ),
    [prospectsQuery.data],
  )

  const isLoading =
    opportunitiesQuery.isLoading || prospectsQuery.isLoading

  const isError =
    opportunitiesQuery.isError || prospectsQuery.isError

  return (
    <div className="opportunities-page">
      <header className="opportunities-hero">
        <div className="opportunities-hero-content">
          <span>COMERCIAL / PIPELINE</span>
          <h2>Oportunidades comerciales</h2>
          <p>
            Prospectos potenciales registrados con
            oportunidad de venta.
          </p>
        </div>

        <div className="opportunities-summary">
          <small>OPORTUNIDADES</small>
          <strong>
            {isLoading ? '—' : opportunities.length}
          </strong>
        </div>
      </header>

      {isError && (
        <div className="opportunities-error">
          No fue posible cargar las oportunidades.
        </div>
      )}

      <section className="opportunities-panel">
        <header className="opportunities-panel-header">
          <div>
            <span>VISTA COMERCIAL</span>
            <h3>Resumen de oportunidades</h3>
          </div>

          {!isLoading && !isError && (
            <small className="opportunities-count">
              {opportunities.length} registros
            </small>
          )}
        </header>

        {isLoading && <p>Cargando oportunidades...</p>}

        {!isLoading && !isError && (
          <div className="commercial-table">
            <table className="opportunities-table">
              <thead>
                <tr>
                  <th>Oportunidad</th>
                  <th>Empresa</th>
                  <th>Contacto</th>
                  <th>Título</th>
                  <th>Valor estimado</th>
                  <th>Responsable</th>
                </tr>
              </thead>

              <tbody>
                {opportunities.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      No existen oportunidades registradas.
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opportunity) => {
                    const prospect = opportunity.prospect
                      ? prospectsById.get(opportunity.prospect)
                      : undefined

                    return (
                      <tr key={opportunity.id}>
                        <td>
                          {opportunity.opportunity_number}
                        </td>

                        <td>
                          {prospect?.business_name ?? '—'}
                        </td>

                        <td>
                          {prospect?.contact_name ?? '—'}
                        </td>

                        <td>
                          <span className="opportunity-description">
                            {opportunity.title}
                          </span>
                        </td>

                        <td>
                          {opportunity.estimated_value ?? '—'}
                        </td>

                        <td>
                          {opportunity.assigned_to ?? '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
