import "./installation-page.css"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { useMemo, useState } from 'react'

import {
  createInstallation,
  getClients,
  getInstallationTypes,
  getInstallations,
  getProspects,
} from '../../../infrastructure/api/commercialApi'

import type {
  Client,
  CommercialCollection,
  Installation,
  InstallationType,
  Prospect,
} from '../types/commercial'

interface InstallationFormState {
  client_id: string
  installation_type_id: string
  address: string
  gps_lat: string
  gps_lng: string
  cre_asea_permit: string
}

const EMPTY_FORM: InstallationFormState = {
  client_id: '',
  installation_type_id: '',
  address: '',
  gps_lat: '',
  gps_lng: '',
  cre_asea_permit: '',
}

function normalizeCollection<T>(
  data: T[] | CommercialCollection<T> | undefined,
): T[] {
  if (!data) {
    return []
  }

  return Array.isArray(data)
    ? data
    : data.results
}

export default function InstallationsPage() {
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] =
    useState<InstallationFormState>(EMPTY_FORM)

  const installationsQuery = useQuery({
    queryKey: ['master', 'installations'],
    queryFn: getInstallations,
  })

  const clientsQuery = useQuery({
    queryKey: ['master', 'clients'],
    queryFn: getClients,
  })

  const installationTypesQuery = useQuery({
    queryKey: ['master', 'installation-types'],
    queryFn: getInstallationTypes,
  })

  const prospectsQuery = useQuery({
    queryKey: ['commercial', 'prospects'],
    queryFn: getProspects,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createInstallation({
        client_id: form.client_id,
        installation_type_id:
          form.installation_type_id || null,
        address: form.address.trim(),
        gps_lat: form.gps_lat.trim() || null,
        gps_lng: form.gps_lng.trim() || null,
        cre_asea_permit:
          form.cre_asea_permit.trim() || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['master', 'installations'],
      })

      setForm(EMPTY_FORM)
      setShowForm(false)
    },
  })

  const installations = useMemo(
    () =>
      normalizeCollection(
        installationsQuery.data,
      ),
    [installationsQuery.data],
  )

  const clients = useMemo(
    () =>
      normalizeCollection(
        clientsQuery.data,
      ),
    [clientsQuery.data],
  )

  const installationTypes = useMemo(
    () =>
      normalizeCollection(
        installationTypesQuery.data,
      ),
    [installationTypesQuery.data],
  )

  const prospects = useMemo(
    () =>
      normalizeCollection<Prospect>(
        prospectsQuery.data,
      ),
    [prospectsQuery.data],
  )

  const prospectsByInstallationId = useMemo(
    () =>
      new Map(
        prospects
          .filter((prospect) => Boolean(prospect.installation))
          .map((prospect) => [
            prospect.installation as string,
            prospect,
          ]),
      ),
    [prospects],
  )

  const clientsById = useMemo(
    () =>
      new Map(
        clients.map((client) => [
          client.id,
          client,
        ]),
      ),
    [clients],
  )

  const typesById = useMemo(
    () =>
      new Map(
        installationTypes.map((type) => [
          type.id,
          type,
        ]),
      ),
    [installationTypes],
  )

  const handleChange = (
    field: keyof InstallationFormState,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleCancel = () => {
    if (createMutation.isPending) {
      return
    }

    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (
      !form.client_id ||
      !form.address.trim()
    ) {
      return
    }

    createMutation.mutate()
  }

  const canSubmit =
    Boolean(form.client_id) &&
    Boolean(form.address.trim()) &&
    !createMutation.isPending

  return (
    <div className="installations-page">
      <header className="installations-hero">
        <div className="installations-hero-content">
          <span className="installations-hero-eyebrow">
            OPERACIÓN / INSTALACIONES
          </span>

          <h2>
            Instalaciones
          </h2>

          <p>
            Gestión de las instalaciones
            asociadas a clientes de UI-CADO.
          </p>
        </div>

        <button
          type="button"
          className="installations-primary-action"
          onClick={() => setShowForm(true)}
          disabled={createMutation.isPending}
        >
          <span aria-hidden="true">
            +
          </span>

          Nueva instalación
        </button>
      </header>

      {showForm && (
        <section className="installation-form-container">
          <form
            className="installation-form"
            onSubmit={handleSubmit}
          >
            <header className="installation-form-header">
              <div>
                <span>
                  REGISTRO OPERATIVO
                </span>

                <h3>
                  Nueva instalación
                </h3>
              </div>
            </header>

            <div className="installation-form-grid">
              <label>
                <span>Cliente</span>

                <select
                  value={form.client_id}
                  onChange={(event) =>
                    handleChange(
                      'client_id',
                      event.target.value,
                    )
                  }
                  disabled={
                    clientsQuery.isLoading ||
                    createMutation.isPending
                  }
                  required
                >
                  <option value="">
                    Seleccionar cliente
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.business_name}
                      {' — '}
                      {client.rfc ?? 'Sin RFC'}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>
                  Tipo de instalación
                </span>

                <select
                  value={
                    form.installation_type_id
                  }
                  onChange={(event) =>
                    handleChange(
                      'installation_type_id',
                      event.target.value,
                    )
                  }
                  disabled={
                    installationTypesQuery.isLoading ||
                    createMutation.isPending
                  }
                >
                  <option value="">
                    Seleccionar tipo
                  </option>

                  {installationTypes.map(
                    (type) => (
                      <option
                        key={type.id}
                        value={type.id}
                      >
                        {type.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="installation-form-field-wide">
                <span>Dirección</span>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    handleChange(
                      'address',
                      event.target.value,
                    )
                  }
                  placeholder="Dirección de la instalación"
                  rows={3}
                  disabled={
                    createMutation.isPending
                  }
                  required
                />
              </label>

              <label>
                <span>Latitud</span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={form.gps_lat}
                  onChange={(event) =>
                    handleChange(
                      'gps_lat',
                      event.target.value,
                    )
                  }
                  placeholder="19.391000"
                  disabled={
                    createMutation.isPending
                  }
                />
              </label>

              <label>
                <span>Longitud</span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={form.gps_lng}
                  onChange={(event) =>
                    handleChange(
                      'gps_lng',
                      event.target.value,
                    )
                  }
                  placeholder="-99.173000"
                  disabled={
                    createMutation.isPending
                  }
                />
              </label>

              <label className="installation-form-field-wide">
                <span>
                  Permiso CRE / ASEA
                </span>

                <input
                  type="text"
                  value={
                    form.cre_asea_permit
                  }
                  onChange={(event) =>
                    handleChange(
                      'cre_asea_permit',
                      event.target.value,
                    )
                  }
                  placeholder="Número de permiso"
                  disabled={
                    createMutation.isPending
                  }
                />
              </label>
            </div>

            {createMutation.isError && (
              <div
                className="installation-form-error"
                role="alert"
              >
                No fue posible crear la
                instalación. Verifique la
                información e intente nuevamente.
              </div>
            )}

            {(clientsQuery.isError ||
              installationTypesQuery.isError) && (
              <div
                className="installation-form-error"
                role="alert"
              >
                No fue posible cargar los datos
                necesarios para registrar la
                instalación.
              </div>
            )}

            <footer className="installation-form-actions">
              <button
                type="button"
                className="installation-secondary-action"
                onClick={handleCancel}
                disabled={
                  createMutation.isPending
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="installations-primary-action"
                disabled={!canSubmit}
              >
                {createMutation.isPending
                  ? 'Guardando...'
                  : 'Crear instalación'}
              </button>
            </footer>
          </form>
        </section>
      )}

      {installationsQuery.isError && (
        <div
          className="installations-error"
          role="alert"
        >
          No fue posible cargar las
          instalaciones.
        </div>
      )}

      <section className="installations-panel">
        <header className="installations-panel-header">
          <div>
            <span>
              REGISTRO OPERATIVO
            </span>

            <h3>
              Instalaciones registradas
            </h3>
          </div>

          <strong>
            {installationsQuery.isLoading
              ? 'Cargando'
              : `${installations.length} registros`}
          </strong>
        </header>

        <div className="installations-table-wrapper">
          <table className="installations-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Dirección</th>
                <th>GPS</th>
                <th>CRE / ASEA</th>
              </tr>
            </thead>

            <tbody>
              {installationsQuery.isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="installations-empty-state"
                  >
                    Cargando instalaciones...
                  </td>
                </tr>
              ) : installations.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="installations-empty-state"
                  >
                    No existen instalaciones
                    registradas.
                  </td>
                </tr>
              ) : (
                installations.map(
                  (
                    installation: Installation,
                  ) => {
                    const client: Client | undefined =
                      installation.client_id
                        ? clientsById.get(
                            installation.client_id,
                          )
                        : undefined

                    const type:
                      | InstallationType
                      | undefined =
                      installation
                        .installation_type_id
                        ? typesById.get(
                            installation.installation_type_id,
                          )
                        : undefined

                    const prospect =
                      prospectsByInstallationId.get(
                        installation.id,
                      )

                    const installationAddress =
                      [
                        installation.street,
                        installation.street_number,
                      ]
                        .filter(Boolean)
                        .join(' ') ||
                      [
                        installation.municipality,
                        installation.state,
                        installation.postal_code
                          ? `CP ${installation.postal_code}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(', ') ||
                      installation.address ||
                      '—'

                    return (
                      <tr
                        key={installation.id}
                      >
                        <td className="installation-table-primary">
                          {client?.business_name ??
                            prospect?.business_name ??
                            'Sin cliente'}
                        </td>

                        <td>
                          {type?.name ?? '—'}
                        </td>

                        <td>
                          {installationAddress}
                        </td>

                        <td>
                          {installation.gps_lat &&
                          installation.gps_lng
                            ? `${installation.gps_lat}, ${installation.gps_lng}`
                            : '—'}
                        </td>

                        <td>
                          {
                            installation.cre_asea_permit ??
                            '—'
                          }
                        </td>
                      </tr>
                    )
                  },
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
