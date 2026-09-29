import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getInstallation,
  getServiceCatalog,
  updateInstallation,
} from '../../../../infrastructure/api/commercialApi'

import type {
  Installation,
  Prospect,
  ServiceCatalog,
} from '../../types/commercial'

interface ProspectInstallationModalProps {
  open: boolean
  prospect: Prospect
  onClose: () => void
}

interface InstallationFormState {
  installation_type_id: string
  street: string
  street_number: string
  state: string
  municipality: string
  postal_code: string
  gps_lat: string
  gps_lng: string
  cre_asea_permit: string
}

export default function ProspectInstallationModal({
  open,
  prospect,
  onClose,
}: ProspectInstallationModalProps) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState<InstallationFormState>({
    installation_type_id: '',
    street: '',
    street_number: '',
    state: '',
    municipality: '',
    postal_code: '',
    gps_lat: '',
    gps_lng: '',
    cre_asea_permit: '',
  })

  const installationId = prospect.installation

  const installationQuery = useQuery<Installation>({
    queryKey: ['master', 'installations', installationId],
    queryFn: () => getInstallation(installationId as string),
    enabled: open && Boolean(installationId),
  })

  const serviceCatalogQuery = useQuery<
    ServiceCatalog[] | { results: ServiceCatalog[] }
  >({
    queryKey: ['master', 'service-catalog'],
    queryFn: getServiceCatalog,
    enabled: open && Boolean(prospect.service_catalog_id),
  })

  const services = Array.isArray(serviceCatalogQuery.data)
    ? serviceCatalogQuery.data
    : serviceCatalogQuery.data?.results ?? []

  const selectedService = useMemo(
    () =>
      services.find(
        (service) => service.id === prospect.service_catalog_id,
      ),
    [services, prospect.service_catalog_id],
  )

  const allowedInstallationTypes =
    selectedService?.installation_types ?? []

  useEffect(() => {
    if (!installationQuery.data) {
      return
    }

    const installation = installationQuery.data

    setForm({
      installation_type_id: installation.installation_type_id ?? '',
      street: installation.street ?? '',
      street_number: installation.street_number ?? '',
      state: installation.state ?? '',
      municipality: installation.municipality ?? '',
      postal_code: installation.postal_code ?? '',
      gps_lat: installation.gps_lat ?? '',
      gps_lng: installation.gps_lng ?? '',
      cre_asea_permit: installation.cre_asea_permit ?? '',
    })
  }, [installationQuery.data])

  const updateMutation = useMutation({
    mutationFn: () =>
      updateInstallation(installationId as string, {
        installation_type_id:
          form.installation_type_id || null,
        street: form.street.trim() || null,
        street_number: form.street_number.trim() || null,
        state: form.state.trim() || null,
        municipality: form.municipality.trim() || null,
        postal_code: form.postal_code.trim() || null,
        gps_lat: form.gps_lat.trim() || null,
        gps_lng: form.gps_lng.trim() || null,
        cre_asea_permit:
          form.cre_asea_permit.trim() || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['master', 'installations', installationId],
      })

      await queryClient.invalidateQueries({
        queryKey: ['commercial', 'prospects', prospect.id],
      })

      await queryClient.invalidateQueries({
        queryKey: ['commercial', 'prospects'],
      })

      onClose()
    },
  })

  if (!open) {
    return null
  }

  if (!installationId) {
    return (
      <div
        className="crm-modal-backdrop"
        role="presentation"
        onMouseDown={onClose}
      >
        <section
          className="crm-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prospect-installation-modal-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="crm-modal__header">
            <div>
              <span className="crm-eyebrow">
                EXPEDIENTE COMERCIAL
              </span>

              <h3
                id="prospect-installation-modal-title"
                className="crm-text-h2"
              >
                Instalación
              </h3>
            </div>

            <button
              type="button"
              className="crm-modal__close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          </header>

          <div className="crm-modal__body">
            <p className="crm-modal-notice">
              Este Prospecto no tiene una instalación asociada.
            </p>
          </div>
        </section>
      </div>
    )
  }

  const loading =
    installationQuery.isLoading ||
    serviceCatalogQuery.isLoading

  const installationError =
    installationQuery.error instanceof Error
      ? installationQuery.error.message
      : null

  const serviceCatalogError =
    serviceCatalogQuery.error instanceof Error
      ? serviceCatalogQuery.error.message
      : null

  const canSave =
    Boolean(form.installation_type_id) &&
    !loading &&
    !updateMutation.isPending

  const fieldDisabled =
    loading || updateMutation.isPending

  return (
    <div
      className="crm-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="crm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prospect-installation-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="crm-modal__header">
          <div>
            <span className="crm-eyebrow">
              EXPEDIENTE COMERCIAL
            </span>

            <h3
              id="prospect-installation-modal-title"
              className="crm-text-h2"
            >
              Completar instalación
            </h3>
          </div>

          <button
            type="button"
            className="crm-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <form
          className="crm-modal__body"
          onSubmit={(event) => {
            event.preventDefault()

            if (canSave) {
              updateMutation.mutate()
            }
          }}
        >
          <p className="crm-modal-notice">
            Esta instalación ya está asociada al Prospecto.
            Completa la información disponible sin crear un
            registro adicional.
          </p>

          {installationError && (
            <p className="crm-modal-notice crm-modal-notice--error">
              Error al cargar la instalación: {installationError}
            </p>
          )}

          {serviceCatalogError && (
            <p className="crm-modal-notice crm-modal-notice--error">
              Error al cargar los tipos permitidos:{' '}
              {serviceCatalogError}
            </p>
          )}

          <div className="crm-form-grid">
            <label className="crm-form-group">
              <span className="crm-label">
                Tipo de instalación
              </span>

              <select
                className="crm-select"
                value={form.installation_type_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    installation_type_id:
                      event.target.value,
                  }))
                }
                disabled={fieldDisabled}
                aria-disabled={fieldDisabled}
                required
              >
                <option value="">
                  Selecciona un tipo
                </option>

                {allowedInstallationTypes.map((type) => (
                  <option
                    key={type.id}
                    value={type.id}
                  >
                    {type.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="crm-form-group">
              <span className="crm-label">Calle</span>

              <input
                className="crm-input"
                type="text"
                value={form.street}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    street: event.target.value,
                  }))
                }
                placeholder="Nombre de la calle"
                disabled={fieldDisabled}
                aria-disabled={fieldDisabled}
              />
            </label>

            <label className="crm-form-group">
              <span className="crm-label">Número</span>

              <input
                className="crm-input"
                type="text"
                value={form.street_number}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    street_number: event.target.value,
                  }))
                }
                placeholder="Número exterior"
                disabled={fieldDisabled}
                aria-disabled={fieldDisabled}
              />
            </label>

            <label className="crm-form-group">
              <span className="crm-label">Estado</span>

              <input
                className="crm-input"
                type="text"
                value={form.state}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    state: event.target.value,
                  }))
                }
                placeholder="Estado"
                disabled={fieldDisabled}
                aria-disabled={fieldDisabled}
              />
            </label>

            <label className="crm-form-group">
              <span className="crm-label">Municipio</span>

              <input
                className="crm-input"
                type="text"
                value={form.municipality}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    municipality: event.target.value,
                  }))
                }
                placeholder="Municipio"
                disabled={fieldDisabled}
                aria-disabled={fieldDisabled}
              />
            </label>

            <label className="crm-form-group">
              <span className="crm-label">CP</span>

              <input
                className="crm-input"
                type="text"
                value={form.postal_code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    postal_code: event.target.value,
                  }))
                }
                placeholder="Código postal"
                disabled={fieldDisabled}
                aria-disabled={fieldDisabled}
              />
            </label>

            <label className="crm-form-group">
              <span className="crm-label">
                Permiso CRE/ASEA
              </span>

              <input
                className="crm-input"
                type="text"
                value={form.cre_asea_permit}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cre_asea_permit: event.target.value,
                  }))
                }
                placeholder="Número de permiso"
                disabled={fieldDisabled}
                aria-disabled={fieldDisabled}
              />
            </label>

            <label className="crm-form-group">
              <span className="crm-label">Latitud</span>

              <input
                className="crm-input"
                type="text"
                value={form.gps_lat}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gps_lat: event.target.value,
                  }))
                }
                placeholder="19.432608"
                disabled={fieldDisabled}
                aria-disabled={fieldDisabled}
              />
            </label>

            <label className="crm-form-group">
              <span className="crm-label">Longitud</span>

              <input
                className="crm-input"
                type="text"
                value={form.gps_lng}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gps_lng: event.target.value,
                  }))
                }
                placeholder="-99.133209"
                disabled={fieldDisabled}
                aria-disabled={fieldDisabled}
              />
            </label>
          </div>

          {updateMutation.error instanceof Error && (
            <p className="crm-modal-notice crm-modal-notice--error">
              {updateMutation.error.message}
            </p>
          )}

          <div className="crm-form-actions">
            <button
              type="button"
              className="crm-btn crm-btn--secondary"
              onClick={onClose}
              disabled={updateMutation.isPending}
              aria-disabled={updateMutation.isPending}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="crm-btn crm-btn--primary"
              disabled={!canSave}
              aria-disabled={!canSave}
            >
              {updateMutation.isPending
                ? 'Guardando...'
                : 'Guardar instalación'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}