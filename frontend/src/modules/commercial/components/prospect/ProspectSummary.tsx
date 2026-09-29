import type {
  Installation,
  Prospect,
} from '../../types/commercial'

interface ProspectSummaryProps {
  prospect: Prospect
  installation?: Installation | null
}

function valueOrDash(value: string | null | undefined) {
  return value || '—'
}

export default function ProspectSummary({
  prospect,
  installation,
}: ProspectSummaryProps) {
  return (
    <div className="crm-detail-grid">
      <div className="crm-display-sunken">
        <strong className="crm-label">Empresa</strong>
        <p className="crm-text-body">
          {valueOrDash(prospect.business_name)}
        </p>
      </div>

      <div className="crm-display-sunken">
        <strong className="crm-label">RFC</strong>
        <p className="crm-text-body">
          {valueOrDash(prospect.rfc)}
        </p>
      </div>

      <div className="crm-display-sunken">
        <strong className="crm-label">Contacto</strong>
        <p className="crm-text-body">
          {valueOrDash(prospect.contact_name)}
        </p>
      </div>

      <div className="crm-display-sunken">
        <strong className="crm-label">
          Correo electrónico
        </strong>
        <p className="crm-text-body">
          {valueOrDash(prospect.contact_email)}
        </p>
      </div>

      <div className="crm-display-sunken">
        <strong className="crm-label">Teléfono</strong>
        <p className="crm-text-body">
          {valueOrDash(prospect.contact_phone)}
        </p>
      </div>

      <div className="crm-display-sunken">
        <strong className="crm-label">
          Tipo de instalación
        </strong>
        <p className="crm-text-body">
          {prospect.installation_type_detail?.name || '—'}
        </p>
      </div>

      <div className="crm-display-sunken">
        <strong className="crm-label">Origen</strong>
        <p className="crm-text-body">
          {valueOrDash(prospect.source)}
        </p>
      </div>

      <div className="crm-display-sunken">
        <strong className="crm-label">Versión</strong>
        <p className="crm-text-body">
          {prospect.version_lock}
        </p>
      </div>

      <div className="crm-display-sunken crm-detail-grid__full">
        <strong className="crm-label">
          Instalación asociada
        </strong>

        {installation ? (
          <div>
            <p className="crm-text-body">
              {[
                installation.street,
                installation.street_number,
              ]
                .filter(Boolean)
                .join(' ') || 'Dirección no capturada'}
            </p>

            <p className="crm-text-body">
              {[
                installation.municipality,
                installation.state,
                installation.postal_code
                  ? `CP ${installation.postal_code}`
                  : null,
              ]
                .filter(Boolean)
                .join(', ') || 'Ubicación no capturada'}
            </p>

            <p className="crm-text-body">
              {installation.gps_lat &&
              installation.gps_lng
                ? `GPS: ${installation.gps_lat}, ${installation.gps_lng}`
                : 'GPS no capturado'}
            </p>

            <p className="crm-text-body">
              {installation.cre_asea_permit
                ? `Permiso CRE / ASEA: ${installation.cre_asea_permit}`
                : 'Permiso CRE / ASEA no capturado'}
            </p>
          </div>
        ) : prospect.installation ? (
          <p className="crm-text-body">
            Cargando instalación...
          </p>
        ) : (
          <p className="crm-text-body">—</p>
        )}
      </div>

      <div className="crm-display-sunken crm-detail-grid__full">
        <strong className="crm-label">
          Interés comercial
        </strong>
        <p className="crm-text-body">
          {valueOrDash(prospect.interest_description)}
        </p>
      </div>

      <div className="crm-display-sunken crm-detail-grid__full">
        <strong className="crm-label">
          Notas comerciales
        </strong>
        <p className="crm-text-body">
          {valueOrDash(prospect.notes)}
        </p>
      </div>
    </div>
  )
}