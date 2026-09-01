import "./agreements-page.css"


import { useQuery } from '@tanstack/react-query'

import { getAgreements } from '../../../infrastructure/api/commercialApi'
import CommercialTable from '../../../shared/components/CommercialTable'
import StatusBadge from '../../../shared/components/StatusBadge'

export default function AgreementsPage() {
  const query = useQuery({
    queryKey: ['commercial', 'agreements'],
    queryFn: getAgreements,
  })

  const agreements = query.data?.results ?? []

  return (
          <div className="agreements-page">
        <header className="agreements-hero">
          <div>
            <span>
              COMERCIAL / FORMALIZACIÓN
            </span>

            <h2>
              Contratos y acuerdos
            </h2>

            <p>
              Control de la formalización contractual
              derivada de las oportunidades y cotizaciones
              comerciales.
            </p>
          </div>

          <div className="agreements-summary">
            <small>REGISTROS</small>

            <strong>
              {query.data?.count ?? 0}
            </strong>
          </div>
        </header>

        <section className="agreements-panel">
          <header className="agreements-panel-header">
            <div>
              <span>
                FORMALIZACIÓN CONTRACTUAL
              </span>

              <h3>
                Registro de acuerdos
              </h3>
            </div>

            <strong>
              {query.isLoading
                ? 'Cargando'
                : `${agreements.length} registros`}
            </strong>
          </header>

          <CommercialTable
            headers={[
              'Número',
              'Cotización',
              'Oportunidad',
              'Cliente',
              'Estado',
              'Inicio',
              'Vencimiento',
            ]}
          >
            {query.isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="empty-state"
                >
                  Cargando contratos...
                </td>
              </tr>
            ) : agreements.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="empty-state"
                >
                  No existen contratos registrados.
                </td>
              </tr>
            ) : (
              agreements.map((item) => (
                <tr key={item.id}>
                  <td className="table-primary">
                    {item.agreement_number}
                  </td>

                  <td>
                    {item.quotation_id}
                  </td>

                  <td>
                    {item.opportunity_id}
                  </td>

                  <td>
                    {item.client_id}
                  </td>

                  <td>
                    <StatusBadge
                      value={item.status}
                    />
                  </td>

                  <td>
                    {item.effective_from ?? '—'}
                  </td>

                  <td>
                    {item.effective_until ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </CommercialTable>
        </section>
      </div>
  )
}