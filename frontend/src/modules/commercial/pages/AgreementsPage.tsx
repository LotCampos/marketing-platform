import "./agreements-page.css"

import { useMutation, useQuery } from '@tanstack/react-query'

import {
  getAgreementPdf,
  getAgreements,
} from '../../../infrastructure/api/commercialApi'
import CommercialTable from '../../../shared/components/CommercialTable'
import StatusBadge from '../../../shared/components/StatusBadge'

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No fue posible completar la operación.'
}

export default function AgreementsPage() {
  const query = useQuery({
    queryKey: ['commercial', 'agreements'],
    queryFn: getAgreements,
  })

  const pdfMutation = useMutation({
    mutationFn: (agreementId: string) =>
      getAgreementPdf(agreementId),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    },
  })

  const agreements = query.data?.results ?? []

  return (
    <main className="page-container commercial-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">COMERCIAL / FORMALIZACIÓN</p>
          <h1>Contratos y acuerdos</h1>
          <p className="page-description">
            Expedientes contractuales derivados de oportunidades y cotizaciones.
          </p>
        </div>
        <div>
          <strong>{query.data?.count ?? 0}</strong>
          <span> registros</span>
        </div>
      </header>

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">FOR-G-016 REV.18</p>
            <h2>Propuestas económicas y técnicas — Contrato de Servicios</h2>
            <p>Consulta el expediente y genera el documento oficial en PDF.</p>
          </div>
        </div>

        {query.isLoading && <p>Cargando contratos...</p>}
        {query.isError && <p role="alert">{getErrorMessage(query.error)}</p>}

        {!query.isLoading && !query.isError && agreements.length === 0 && (
          <p>No existen contratos registrados. Los acuerdos se crean desde una cotización válida.</p>
        )}

        {agreements.length > 0 && (
          <CommercialTable
            headers={[
              'Acuerdo',
              'PET',
              'Cotización',
              'Cliente',
              'Estado',
              'Inicio',
              'Vencimiento',
              'Documento',
            ]}
          >
            {agreements.map((item) => (
              <tr key={item.id}>
                <td className="table-primary">{item.agreement_number}</td>
                <td>{item.pet_number ?? '—'}</td>
                <td>{item.quotation_id}</td>
                <td>{item.client_id}</td>
                <td><StatusBadge value={item.status} /></td>
                <td>{item.effective_from ?? '—'}</td>
                <td>{item.effective_until ?? '—'}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => pdfMutation.mutate(item.id)}
                    disabled={pdfMutation.isPending}
                  >
                    {pdfMutation.isPending ? 'Generando...' : 'Ver FOR-G-016'}
                  </button>
                </td>
              </tr>
            ))}
          </CommercialTable>
        )}

        {pdfMutation.isError && (
          <p role="alert">{getErrorMessage(pdfMutation.error)}</p>
        )}
      </section>
    </main>
  )
}
