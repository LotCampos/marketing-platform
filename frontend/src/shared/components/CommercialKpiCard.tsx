interface CommercialKpiCardProps {
  label: string
  value: number
  description: string
}

export default function CommercialKpiCard({
  label,
  value,
  description,
}: CommercialKpiCardProps) {
  return (
    <article className="kpi-card">
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
      <span className="kpi-description">{description}</span>
    </article>
  )
}