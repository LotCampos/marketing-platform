import type { ReactNode } from 'react'

interface CommercialTableProps {
  headers: string[]
  children: ReactNode
  emptyMessage?: string
}

export default function CommercialTable({
  headers,
  children,
  emptyMessage = 'No existen registros.',
}: CommercialTableProps) {
  return (
   
    <section className='crm-table-container'>
      <div className="crm-table">
      <table className="crm-table">
        <thead>
          <tr className="crm-table__tr">
            {headers.map((header) => (
              <th
                key={header}
                className="crm-table__th"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {children || (
            <tr className="crm-table__tr">
              <td
                colSpan={headers.length}
                className="crm-table__td"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
     </div>
    </section>
  )
}