import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  getOpportunities,
  getProspects,
} from '../../../infrastructure/api/commercialApi'

import type {
  CommercialCollection,
  Opportunity,
  Prospect,
} from '../types/commercial'

import CommercialTable from '../../../shared/components/CommercialTable'

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
    () =>
      collectionResults<Opportunity>(
        opportunitiesQuery.data,
      ),
    [opportunitiesQuery.data],
  )

  const prospectsById = useMemo(
    () =>
      new Map(
        collectionResults<Prospect>(
          prospectsQuery.data,
        ).map((prospect) => [
          prospect.id,
          prospect,
        ]),
      ),
    [prospectsQuery.data],
  )

  const isLoading =
    opportunitiesQuery.isLoading ||
    prospectsQuery.isLoading

  const isError =
    opportunitiesQuery.isError ||
    prospectsQuery.isError

  return (
    <main className="crm-page-content">
      <header className="crm-page-header">
        <div className="crm-page-header__content">
          <p className="crm-eyebrow">
            COMERCIAL / PIPELINE
          </p>

          <h1 className="crm-text-h1">
            Oportunidades comerciales
          </h1>

          <p className="crm-text-body">
            Prospectos potenciales registrados con
            oportunidad de venta.
          </p>
        </div>
      </header>

      <div className="crm-page-body">
        {isError && (
          <div
            className="crm-alert crm-alert--error"
            role="alert"
          >
            No fue posible cargar las
            oportunidades.
          </div>
        )}

        <section className="crm-panel">
          <header className="crm-panel__header">
            <div className="crm-panel__heading">
              <span className="crm-eyebrow">
                VISTA COMERCIAL
              </span>

              <h2 className="crm-panel__title">
                Resumen de oportunidades
              </h2>
            </div>

            <div className="crm-panel__meta">
              {isLoading
                ? 'Cargando'
                : `${opportunities.length} registros`}
            </div>
          </header>

          <div className="crm-panel__body">
            {isLoading ? (
              <div className="crm-empty-state">
                <p className="crm-text-body">
                  Cargando oportunidades...
                </p>
              </div>
            ) : !isError ? (
              <CommercialTable
                headers={[
                  'Oportunidad',
                  'Empresa',
                  'Contacto',
                  'Título',
                  'Valor estimado',
                  'Responsable',
                ]}
              >
                {opportunities.length === 0 ? (
                  <tr className="crm-table__tr">
                    <td
                      className="crm-table__td"
                      colSpan={6}
                    >
                      <span className="crm-text-body">
                        No existen oportunidades
                        registradas.
                      </span>
                    </td>
                  </tr>
                ) : (
                  opportunities.map((opportunity) => {
                    const prospect =
                      opportunity.prospect
                        ? prospectsById.get(
                            opportunity.prospect,
                          )
                        : undefined

                    return (
                      <tr
                        key={opportunity.id}
                        className="crm-table__tr"
                      >
                        <td className="crm-table__td crm-table__td--primary">
                          {opportunity.opportunity_number}
                        </td>

                        <td className="crm-table__td crm-table__td--secondary">
                          {prospect?.business_name ?? '—'}
                        </td>

                        <td className="crm-table__td crm-table__td--secondary">
                          {prospect?.contact_name ?? '—'}
                        </td>

                        <td className="crm-table__td">
                          <span className="crm-table__td--truncate">
                            {opportunity.title}
                          </span>
                        </td>

                        <td className="crm-table__td crm-table__td--amount">
                          {opportunity.estimated_value ?? '—'}
                        </td>

                        <td className="crm-table__td crm-table__td--secondary">
                          {opportunity.assigned_to ?? '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </CommercialTable>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
