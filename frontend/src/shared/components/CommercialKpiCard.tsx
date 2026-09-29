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
    <article className="crm-kpi-card">
      <span className="crm-eyebrow">
        {label}
      </span>

      <strong className="crm-kpi-card__value">
        {value}
      </strong>

      <span className="crm-text-body">
        {description}
      </span>
    </article>
  )
}