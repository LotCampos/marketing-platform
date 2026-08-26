import './commercial-pages.css'


import { useQuery } from '@tanstack/react-query'

import CommercialHeader from '../../../shared/components/CommercialHeader'

import CommercialSidebar from '../../../shared/components/CommercialSidebar'

import CommercialTable from '../../../shared/components/CommercialTable'

import StatusBadge from '../../../shared/components/StatusBadge'

import { getAgreements } from '../../../infrastructure/api/commercialApi'

export default function AgreementsPage() {
  const query = useQuery({
    queryKey: ['commercial', 'agreements'],
    queryFn: getAgreements,
  })

  return (
    <div className="application-shell">
      <CommercialSidebar />

      <div className="application-main">
        <CommercialHeader title="Contratos" />

        <main className="page-container">
          <header className="page-header">
            <div>
              <p className="eyebrow">COMERCIAL / FORMALIZACIÓN</p>
              <h1>Contratos y acuerdos</h1>
              <p className="page-description">
                Control de acuerdos derivados del proceso comercial.
              </p>
            </div>
          </header>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>Acuerdos</h2>
              <span className="record-count">
                {query.data?.count ?? 0} registros
              </span>
            </div>

            <CommercialTable
              headers={[
                'Número',
                'Cotización',
                'Oportunidad',
                'Cliente',
                'Estado',
                'Vigencia',
              ]}
            >
              {(query.data?.results ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="table-primary">{item.agreement_number}</td>
                  <td>{item.quotation_id}</td>
                  <td>{item.opportunity_id}</td>
                  <td>{item.client_id}</td>
                  <td>
                    <StatusBadge value={item.status} />
                  </td>
                  <td>
                    {item.effective_from ?? '—'} →{' '}
                    {item.effective_until ?? '—'}
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