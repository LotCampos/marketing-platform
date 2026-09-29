import type { ProspectStatus } from '../../types/commercial'

interface ProspectStatusButtonProps {
  status: ProspectStatus
  labels: Record<ProspectStatus, string>
  disabled?: boolean
  onChange: (status: ProspectStatus) => void
}

export default function ProspectStatusButton({
  status,
  labels,
  disabled = false,
  onChange,
}: ProspectStatusButtonProps) {
  return (
    <label className="crm-form-group">
      <span className="crm-label">
        Estado del prospecto
      </span>

      <select
        className="crm-select"
        value={status}
        disabled={disabled}
        aria-disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value as ProspectStatus,
          )
        }
        aria-label="Cambiar estado del prospecto"
      >
        {Object.entries(labels).map(
          ([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ),
        )}
      </select>
    </label>
  )
}