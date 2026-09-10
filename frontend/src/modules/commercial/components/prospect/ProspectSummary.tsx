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
    <div className="prospect-detail-grid">
      <div>
        <strong>Empresa</strong>
        <p>{valueOrDash(prospect.business_name)}</p>
      </div>

      <div>
        <strong>RFC</strong>
        <p>{valueOrDash(prospect.rfc)}</p>
      </div>

      <div>
        <strong>Contacto</strong>
        <p>{valueOrDash(prospect.contact_name)}</p>
      </div>

      <div>
        <strong>Correo electrónico</strong>
        <p>{valueOrDash(prospect.contact_email)}</p>
      </div>

      <div>
        <strong>Teléfono</strong>
        <p>{valueOrDash(prospect.contact_phone)}</p>
      </div>

      <div>
        <strong>Tipo de instalación</strong>
        <p>
          {prospect.installation_type_detail?.name || '—'}
        </p>
      </div>

      <div>
        <strong>Origen</strong>
        <p>{valueOrDash(prospect.source)}</p>
      </div>

      <div>
        <strong>Versión</strong>
        <p>{prospect.version_lock}</p>
      </div>

      <div className="prospect-detail-full">
        <strong>Instalación asociada</strong>
        {installation ? (
          <div>
            <p>
              {[
                installation.street,
                installation.street_number,
              ]
                .filter(Boolean)
                .join(' ') || 'Dirección no capturada'}
            </p>
            <p>
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
            <p>
              {installation.gps_lat && installation.gps_lng
                ? `GPS: ${installation.gps_lat}, ${installation.gps_lng}`
                : 'GPS no capturado'}
            </p>
            <p>
              {installation.cre_asea_permit
                ? `Permiso CRE / ASEA: ${installation.cre_asea_permit}`
                : 'Permiso CRE / ASEA no capturado'}
            </p>
          </div>
        ) : prospect.installation ? (
          <p>Cargando instalación...</p>
        ) : (
          <p>—</p>
        )}
      </div>

      <div className="prospect-detail-full">
        <strong>Interés comercial</strong>
        <p>{valueOrDash(prospect.interest_description)}</p>
      </div>

      <div className="prospect-detail-full">
        <strong>Notas comerciales</strong>
        <p>{valueOrDash(prospect.notes)}</p>
      </div>
    </div>
  )
}
