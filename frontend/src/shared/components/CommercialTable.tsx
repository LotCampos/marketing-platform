import "./CommercialTable.css"

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
    <div className="table-container">
      <table className="commercial-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {children || (
            <tr>
              <td colSpan={headers.length} className="empty-state">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}