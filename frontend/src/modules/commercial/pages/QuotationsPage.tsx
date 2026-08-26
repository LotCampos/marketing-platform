import './commercial-pages.css'


import { useQuery } from '@tanstack/react-query'


import CommercialHeader from '../../../shared/components/CommercialHeader'

import CommercialSidebar from '../../../shared/components/CommercialSidebar'

import CommercialTable from '../../../shared/components/CommercialTable'


import { getQuotations } from '../../../infrastructure/api/commercialApi'

export default function QuotationsPage() {
  const query = useQuery({
    queryKey: ['commercial', 'quotations'],
    queryFn: getQuotations,
  })

  return (
    <div className="application-shell">
      <CommercialSidebar />

      <div className="application-main">
        <CommercialHeader title="Cotizaciones" />

        <main className="page-container commercial-page">
          <header className="page-header">
            <div>
              <p className="eyebrow">
                COMERCIAL / COTIZACIONES
              </p>

              <h1>
                Cotizaciones comerciales
              </h1>

              <p className="page-description">
                Gestión de propuestas económicas asociadas a oportunidades.
              </p>
            </div>
          </header>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  Cotizaciones
                </h2>
              </div>

              <span className="record-count">
                {query.data?.count ?? 0} registros
              </span>
            </div>

            <CommercialTable
              headers={[
                'Número',
                'Oportunidad',
                'Fecha',
                'Vigencia',
                'Subtotal',
                'Total',
                'Moneda',
              ]}
            >
              {(query.data?.results ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="table-primary">
                    {item.quotation_number}
                  </td>

                  <td>
                    {item.opportunity_id}
                  </td>

                  <td>
                    {item.issue_date}
                  </td>

                  <td>
                    {item.valid_until}
                  </td>

                  <td>
                    {item.subtotal}
                  </td>

                  <td>
                    {item.total_amount}
                  </td>

                  <td>
                    {item.currency}
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