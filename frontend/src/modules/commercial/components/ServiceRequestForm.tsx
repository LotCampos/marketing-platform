import './commercial-forms.css'
import { useMemo, useState } from 'react'
import type {
  ChangeEvent,
  FormEvent,
} from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  getClients,
  getInstallations,
} from '../../../infrastructure/api/masterApi'

import {
  getServiceCatalog,
} from '../../../infrastructure/api/commercialApi'

import type {
  Client,
  Installation,
  MasterCollection,
} from '../../master/types/master'

import type {
  CreateServiceRequestInput,
} from '../types/commercial'

interface ServiceRequestFormProps {
  onSubmit: (
    data: CreateServiceRequestInput,
  ) => void
  onCancel: () => void
  isPending: boolean
}

const initialFormData: CreateServiceRequestInput = {
  client_id: '',
  installation_id: '',
  service_catalog_id: '',
  request_number: '',
  requested_by_name: '',
  requested_by_email: '',
  requested_by_phone: '',
  request_description: '',
}

function normalizeCollection<T>(
  data: T[] | MasterCollection<T>,
): T[] {
  if (Array.isArray(data)) {
    return data
  }

  return data.results ?? []
}

function getClientLabel(
  client: Client,
): string {
  return client.business_name
    ? `${client.business_name} — ${client.rfc}`
    : client.rfc
}

function getInstallationLabel(
  installation: Installation,
): string {
  return installation.cre_asea_permit
    ? `${installation.address} — ${installation.cre_asea_permit}`
    : installation.address
}

export const ServiceRequestForm = ({
  onSubmit,
  onCancel,
  isPending,
}: ServiceRequestFormProps) => {
  const [formData, setFormData] =
    useState<CreateServiceRequestInput>(
      initialFormData,
    )

  const clientsQuery = useQuery({
    queryKey: ['master', 'clients'],
    queryFn: getClients,
  })

  const installationsQuery = useQuery({
    queryKey: ['master', 'installations'],
    queryFn: getInstallations,
  })

  const serviceCatalogQuery = useQuery({
    queryKey: ['master', 'service-catalog'],
    queryFn: getServiceCatalog,
  })

  const clients = useMemo(
    () =>
      clientsQuery.data
        ? normalizeCollection(
            clientsQuery.data,
          )
        : [],
    [clientsQuery.data],
  )

  const installations = useMemo(
    () =>
      installationsQuery.data
        ? normalizeCollection(
            installationsQuery.data,
          )
        : [],
    [installationsQuery.data],
  )

  const services = useMemo(
    () =>
      serviceCatalogQuery.data
        ? normalizeCollection(
            serviceCatalogQuery.data,
          )
        : [],
    [serviceCatalogQuery.data],
  )

  const activeServices = useMemo(
    () =>
      services.filter(
        (service) =>
          service.is_active,
      ),
    [services],
  )

  const availableInstallations =
    useMemo(() => {
      if (!formData.client_id) {
        return []
      }

      return installations.filter(
        (installation) =>
          installation.client_id ===
          formData.client_id,
      )
    }, [
      installations,
      formData.client_id,
    ])

  const selectedClient = useMemo(
    () =>
      clients.find(
        (client) =>
          client.id ===
          formData.client_id,
      ),
    [
      clients,
      formData.client_id,
    ],
  )

  const selectedInstallation =
    useMemo(
      () =>
        installations.find(
          (installation) =>
            installation.id ===
            formData.installation_id,
        ),
      [
        installations,
        formData.installation_id,
      ],
    )

  const selectedService = useMemo(
    () =>
      services.find(
        (service) =>
          service.id ===
          formData.service_catalog_id,
      ),
    [
      services,
      formData.service_catalog_id,
    ],
  )

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >,
  ) => {
    const {
      name,
      value,
    } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleClientChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const clientId =
      event.target.value

    setFormData((previous) => ({
      ...previous,
      client_id: clientId,
      installation_id: '',
    }))
  }

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    onSubmit({
      ...formData,

      client_id:
        formData.client_id.trim(),

      installation_id:
        (
          formData.installation_id ?? ''
        ).trim() || null,

      service_catalog_id:
        formData.service_catalog_id.trim(),

      request_number:
        formData.request_number.trim(),

      requested_by_name:
        formData.requested_by_name.trim(),

      requested_by_email:
        formData.requested_by_email.trim(),

      requested_by_phone:
        formData.requested_by_phone.trim(),

      request_description:
        formData.request_description.trim(),
    })
  }

  const catalogLoading =
    clientsQuery.isLoading ||
    installationsQuery.isLoading ||
    serviceCatalogQuery.isLoading

  const catalogError =
    clientsQuery.isError ||
    installationsQuery.isError ||
    serviceCatalogQuery.isError

  const canSubmit =
    !isPending &&
    !catalogLoading &&
    !catalogError &&
    Boolean(formData.client_id) &&
    Boolean(formData.service_catalog_id) &&
    Boolean(
      formData.request_number.trim(),
    ) &&
    Boolean(
      formData.requested_by_name.trim(),
    ) &&
    Boolean(
      formData.requested_by_email.trim(),
    ) &&
    Boolean(
      formData.request_description.trim(),
    )

  return (
    <form
      onSubmit={handleSubmit}
      className="app-form"
    >
      {/* =====================================================
          INTRO
      ====================================================== */}

      <div className="form-intro">
        <div className="form-intro-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 5v14m7-7H5"
            />
          </svg>
        </div>

        <div className="form-intro-content">
          <span className="form-eyebrow">
            NUEVO REGISTRO
          </span>

          <h3 className="form-title">
            Solicitud de servicio
          </h3>

          <p className="form-subtitle">
            Registre el origen, relación corporativa,
            servicio requerido y datos del solicitante.
          </p>
        </div>
      </div>

      {/* =====================================================
          ERROR CATÁLOGOS
      ====================================================== */}

      {catalogError && (
        <div
          className="form-alert"
          role="alert"
        >
          <div className="form-alert-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86 2.82 17a2 2 0 0 0 1.74 3h14.88a2 2 0 0 0 1.74-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              />
            </svg>
          </div>

          <div>
            <strong>
              No fue posible cargar los catálogos
            </strong>

            <p>
              Verifique la disponibilidad del servicio
              API antes de continuar.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          01 — IDENTIFICACIÓN
      ====================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span className="form-section-number">
            01
          </span>

          <div>
            <h4>
              Identificación
            </h4>

            <p>
              Identificador único de la solicitud.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="request_number">
              Número de solicitud
              <span>*</span>
            </label>

            <input
              type="text"
              name="request_number"
              id="request_number"
              required
              maxLength={50}
              value={
                formData.request_number
              }
              onChange={handleChange}
              disabled={isPending}
              placeholder="SOL-2026-000003"
            />

            <small>
              Formato recomendado:
              SOL-AAAA-NNNNNN
            </small>
          </div>
        </div>
      </section>

      {/* =====================================================
          02 — CLIENTE E INSTALACIÓN
      ====================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span className="form-section-number">
            02
          </span>

          <div>
            <h4>
              Cliente e instalación
            </h4>

            <p>
              Relación con el maestro corporativo.
            </p>
          </div>
        </div>

        <div className="form-grid form-grid-2">
          <div className="form-field">
            <label htmlFor="client_id">
              Cliente
              <span>*</span>
            </label>

            <select
              name="client_id"
              id="client_id"
              required
              value={formData.client_id}
              onChange={handleClientChange}
              disabled={
                isPending ||
                clientsQuery.isLoading ||
                clientsQuery.isError
              }
            >
              <option value="">
                {clientsQuery.isLoading
                  ? 'Cargando clientes...'
                  : 'Seleccione un cliente'}
              </option>

              {clients.map((client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {getClientLabel(client)}
                </option>
              ))}
            </select>

            {selectedClient && (
              <div className="form-meta">
                <span>
                  RFC
                </span>

                <strong>
                  {selectedClient.rfc}
                </strong>
              </div>
            )}

            {!clientsQuery.isLoading &&
              !clientsQuery.isError &&
              clients.length === 0 && (
                <small className="field-error">
                  No existen clientes disponibles.
                </small>
              )}
          </div>

          <div className="form-field">
            <label htmlFor="installation_id">
              Instalación
              <em>opcional</em>
            </label>

            <select
              name="installation_id"
              id="installation_id"
              value={
                formData.installation_id ?? ''
              }
              onChange={handleChange}
              disabled={
                isPending ||
                !formData.client_id ||
                installationsQuery.isLoading ||
                installationsQuery.isError
              }
            >
              <option value="">
                {!formData.client_id
                  ? 'Seleccione primero un cliente'
                  : installationsQuery.isLoading
                    ? 'Cargando instalaciones...'
                    : 'Seleccione una instalación'}
              </option>

              {availableInstallations.map(
                (installation) => (
                  <option
                    key={installation.id}
                    value={installation.id}
                  >
                    {getInstallationLabel(
                      installation,
                    )}
                  </option>
                ),
              )}
            </select>

            {selectedInstallation && (
              <div className="form-meta form-meta-stack">
                <div>
                  <span>
                    Dirección
                  </span>

                  <strong>
                    {
                      selectedInstallation.address
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Permiso CRE / ASEA
                  </span>

                  <strong>
                    {
                      selectedInstallation.cre_asea_permit ??
                      'No registrado'
                    }
                  </strong>
                </div>
              </div>
            )}

            {formData.client_id &&
              !installationsQuery.isLoading &&
              availableInstallations.length ===
                0 && (
                <small className="field-warning">
                  El cliente seleccionado no tiene
                  instalaciones disponibles.
                </small>
              )}
          </div>
        </div>
      </section>

      {/* =====================================================
          03 — SERVICIO
      ====================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span className="form-section-number">
            03
          </span>

          <div>
            <h4>
              Servicio requerido
            </h4>

            <p>
              Servicio del catálogo regulatorio.
            </p>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="service_catalog_id">
            Servicio
            <span>*</span>
          </label>

          <select
            name="service_catalog_id"
            id="service_catalog_id"
            required
            value={
              formData.service_catalog_id
            }
            onChange={handleChange}
            disabled={
              isPending ||
              serviceCatalogQuery.isLoading ||
              serviceCatalogQuery.isError
            }
          >
            <option value="">
              {serviceCatalogQuery.isLoading
                ? 'Cargando servicios...'
                : 'Seleccione un servicio'}
            </option>

            {activeServices.map(
              (service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.service_code} —{' '}
                  {service.service_name}
                </option>
              ),
            )}
          </select>
        </div>

        {selectedService && (
          <div className="form-selected-card">
            <div className="form-selected-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6.586a1 1 0 0 1 .707.293l3.414 3.414A1 1 0 0 1 18 7.414V19a2 2 0 0 1-2 2Z"
                />
              </svg>
            </div>

            <div className="form-selected-content">
              <span className="form-selected-code">
                {selectedService.service_code}
              </span>

              <h5>
                {selectedService.service_name}
              </h5>

              {selectedService.regulatory_basis && (
                <p>
                  <strong>
                    Base regulatoria:
                  </strong>{' '}
                  {
                    selectedService.regulatory_basis
                  }
                </p>
              )}
            </div>
          </div>
        )}

        {!serviceCatalogQuery.isLoading &&
          !serviceCatalogQuery.isError &&
          activeServices.length === 0 && (
            <small className="field-error">
              No existen servicios activos disponibles.
            </small>
          )}
      </section>

      {/* =====================================================
          04 — SOLICITANTE
      ====================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span className="form-section-number">
            04
          </span>

          <div>
            <h4>
              Datos del solicitante
            </h4>

            <p>
              Persona responsable de originar la solicitud.
            </p>
          </div>
        </div>

        <div className="form-grid form-grid-2">
          <div className="form-field">
            <label htmlFor="requested_by_name">
              Nombre completo
              <span>*</span>
            </label>

            <input
              type="text"
              name="requested_by_name"
              id="requested_by_name"
              required
              maxLength={255}
              value={
                formData.requested_by_name
              }
              onChange={handleChange}
              disabled={isPending}
              placeholder="Nombre del solicitante"
            />
          </div>

          <div className="form-field">
            <label htmlFor="requested_by_email">
              Correo electrónico
              <span>*</span>
            </label>

            <input
              type="email"
              name="requested_by_email"
              id="requested_by_email"
              required
              maxLength={254}
              value={
                formData.requested_by_email
              }
              onChange={handleChange}
              disabled={isPending}
              placeholder="correo@empresa.com"
            />
          </div>

          <div className="form-field">
            <label htmlFor="requested_by_phone">
              Teléfono
              <em>opcional</em>
            </label>

            <input
              type="text"
              name="requested_by_phone"
              id="requested_by_phone"
              maxLength={50}
              value={
                formData.requested_by_phone
              }
              onChange={handleChange}
              disabled={isPending}
              placeholder="+52 55 0000 0000"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          05 — ALCANCE
      ====================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span className="form-section-number">
            05
          </span>

          <div>
            <h4>
              Alcance de la solicitud
            </h4>

            <p>
              Describa el requerimiento comercial.
            </p>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="request_description">
            Descripción
            <span>*</span>
          </label>

          <textarea
            name="request_description"
            id="request_description"
            rows={4}
            required
            value={
              formData.request_description
            }
            onChange={handleChange}
            disabled={isPending}
            placeholder="Describa el servicio solicitado, alcance preliminar, requerimientos particulares o información relevante para la evaluación comercial."
          />

          <small>
            La descripción quedará asociada al registro
            de solicitud y podrá utilizarse como referencia
            para las siguientes etapas comerciales.
          </small>
        </div>
      </section>

      {/* =====================================================
          RESUMEN
      ====================================================== */}

      {(selectedClient ||
        selectedInstallation ||
        selectedService) && (
        <section className="form-summary">
          <div className="form-summary-header">
            <div>
              <span>
                RESUMEN OPERATIVO
              </span>

              <h4>
                Relación de la solicitud
              </h4>
            </div>

            <div className="form-summary-status">
              <span />
              Datos seleccionados
            </div>
          </div>

          <div className="form-summary-grid">
            <div>
              <span>
                Cliente
              </span>

              <strong>
                {selectedClient?.business_name ??
                  'No seleccionado'}
              </strong>
            </div>

            <div>
              <span>
                Instalación
              </span>

              <strong>
                {selectedInstallation?.address ??
                  'No seleccionada'}
              </strong>
            </div>

            <div>
              <span>
                Servicio
              </span>

              <strong>
                {selectedService?.service_code ??
                  'No seleccionado'}
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <div className="form-actions">
        <div className="form-required">
          <span>*</span>
          Campos obligatorios
        </div>

        <div className="form-action-buttons">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="form-cancel"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className="form-submit"
          >
            {isPending ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="form-spinner"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                    opacity="0.3"
                  />

                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>

                Registrando...
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 5v14m7-7H5"
                  />
                </svg>

                Crear solicitud
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}