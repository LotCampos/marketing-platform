import './commercial-pages.css'


import { useQuery } from '@tanstack/react-query'

import CommercialHeader from '../../../shared/components/CommercialHeader'

import CommercialSidebar from '../../../shared/components/CommercialSidebar'

import CommercialTable from '../../../shared/components/CommercialTable'

import { getOpportunities } from '../../../infrastructure/api/commercialApi'

export default function OpportunitiesPage() {
  const query = useQuery({
    queryKey: ['commercial', 'opportunities'],
    queryFn: getOpportunities,
  })

  return (
    <div className="application-shell">
      <CommercialSidebar />

      <div className="application-main">
        <CommercialHeader title="Oportunidades Comerciales" />

        <main className="page-container">
          <header className="page-header">
            <div>
              <p className="eyebrow">COMERCIAL / PIPELINE</p>
              <h1>Oportunidades</h1>
              <p className="page-description">
                Control del pipeline comercial y oportunidades identificadas.
              </p>
            </div>
          </header>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>Pipeline comercial</h2>
              <span className="record-count">
                {query.data?.count ?? 0} registros
              </span>
            </div>

            <CommercialTable
              headers={[
                'Número',
                'Título',
                'Cliente',
                'Responsable',
                'Valor estimado',
              ]}
            >
              {(query.data?.results ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="table-primary">{item.opportunity_number}</td>
                  <td>{item.title}</td>
                  <td>{item.client_id}</td>
                  <td>{item.assigned_to}</td>
                  <td>{item.estimated_value}</td>
                </tr>
              ))}
            </CommercialTable>
          </section>
        </main>
      </div>
    </div>
  )
}