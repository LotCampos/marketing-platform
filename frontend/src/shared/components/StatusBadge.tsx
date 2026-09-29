interface StatusBadgeProps {
  value: string
}

export default function StatusBadge({ value }: StatusBadgeProps) {
  const normalizedValue = value.toLowerCase()

  let className = 'crm-badge crm-badge--neutral'

  if (
    normalizedValue.includes('active') ||
    normalizedValue.includes('signed') ||
    normalizedValue.includes('approved') ||
    normalizedValue.includes('won') ||
    normalizedValue.includes('converted')
  ) {
    className = 'crm-badge crm-badge--green'
  }

  if (
    normalizedValue.includes('pending') ||
    normalizedValue.includes('draft') ||
    normalizedValue.includes('contacted') ||
    normalizedValue.includes('qualified') ||
    normalizedValue.includes('quoted') ||
    normalizedValue.includes('new')
  ) {
    className = 'crm-badge crm-badge--orange'
  }

  if (
    normalizedValue.includes('rejected') ||
    normalizedValue.includes('cancel') ||
    normalizedValue.includes('lost')
  ) {
    className = 'crm-badge' 
  }

  const isDanger = normalizedValue.includes('rejected') || normalizedValue.includes('cancel') || normalizedValue.includes('lost');

  if(isDanger){
     return <span className="crm-badge" style={{ color: '#fca5a5', background: '#1a0f0f', borderColor: '#7f1d1d', textShadow: 'none' }}>{value}</span>
  }

  return <span className={className}>{value}</span>
}