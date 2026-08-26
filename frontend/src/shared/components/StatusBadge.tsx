interface StatusBadgeProps {
  value: string
}

export default function StatusBadge({ value }: StatusBadgeProps) {
  const normalizedValue = value.toLowerCase()

  let className = 'status-badge status-neutral'

  if (
    normalizedValue.includes('active') ||
    normalizedValue.includes('signed') ||
    normalizedValue.includes('approved')
  ) {
    className = 'status-badge status-success'
  }

  if (
    normalizedValue.includes('pending') ||
    normalizedValue.includes('draft')
  ) {
    className = 'status-badge status-warning'
  }

  if (
    normalizedValue.includes('rejected') ||
    normalizedValue.includes('cancel')
  ) {
    className = 'status-badge status-danger'
  }

  return <span className={className}>{value}</span>
}