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

import CommercialTable from '../../../shared/components/CommercialTable'

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
  data:
    | T[]
    | CommercialCollection<T>
    | undefined,
): T[] {
  if (!data) {
    return []
  }

  return Array.isArray(data) ? data : data.results
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
    queryKey: [
      'master',
      'installation-types',
    ],
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
        gps_lat:
          form.gps_lat.trim() || null,
        gps_lng:
          form.gps_lng.trim() || null,
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
      normalizeCollection(clientsQuery.data),
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
          .filter((prospect) =>
            Boolean(prospect.installation),
          )
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

  const formDisabled =
    createMutation.isPending

  return (
    <main className="crm-page-content">
      <header className="crm-page-header">
        <div className="crm-page-header__content">
          <p className="crm-eyebrow">
            OPERACIÓN / INSTALACIONES
          </p>

          <h1 className="crm-text-h1">
            Instalaciones
          </h1>

          <p className="crm-text-body">
            Gestión de las instalaciones asociadas
            a clientes de UI-CADO.
          </p>
        </div>

        <div className="crm-page-header__actions">
          <button
            type="button"
            className="crm-btn crm-btn--primary"
            onClick={() =>
              setShowForm((value) => !value)
            }
            disabled={createMutation.isPending}
            aria-disabled={
              createMutation.isPending
            }
          >
            <span aria-hidden="true">
              {showForm ? '×' : '+'}
            </span>

            {showForm
              ? 'Cancelar'
              : 'Nueva instalación'}
          </button>
        </div>
      </header>

      <div className="crm-page-body">
        {showForm && (
          <section className="crm-panel">
            <header className="crm-panel__header">
              <div className="crm-panel__heading">
                <span className="crm-eyebrow">
                  REGISTRO OPERATIVO
                </span>

                <h2 className="crm-panel__title">
                  Nueva instalación
                </h2>
              </div>
            </header>

            <div className="crm-form__body">
              <form
                className="crm-form-grid"
                onSubmit={handleSubmit}
              >
                <label className="crm-form-group">
                  <span className="crm-label">
                    Cliente
                  </span>

                  <select
                    className="crm-select"
                    value={form.client_id}
                    onChange={(event) =>
                      handleChange(
                        'client_id',
                        event.target.value,
                      )
                    }
                    disabled={
                      clientsQuery.isLoading ||
                      formDisabled
                    }
                    aria-disabled={
                      clientsQuery.isLoading ||
                      formDisabled
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
                        {client.rfc ??
                          'Sin RFC'}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="crm-form-group">
                  <span className="crm-label">
                    Tipo de instalación
                  </span>

                  <select
                    className="crm-select"
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
                      formDisabled
                    }
                    aria-disabled={
                      installationTypesQuery.isLoading ||
                      formDisabled
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

                <label className="crm-form-group crm-form-group--full">
                  <span className="crm-label">
                    Dirección
                  </span>

                  <textarea
                    className="crm-textarea"
                    value={form.address}
                    onChange={(event) =>
                      handleChange(
                        'address',
                        event.target.value,
                      )
                    }
                    placeholder="Dirección de la instalación"
                    rows={3}
                    disabled={formDisabled}
                    aria-disabled={formDisabled}
                    required
                  />
                </label>

                <label className="crm-form-group">
                  <span className="crm-label">
                    Latitud
                  </span>

                  <input
                    className="crm-input"
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
                    disabled={formDisabled}
                    aria-disabled={formDisabled}
                  />
                </label>

                <label className="crm-form-group">
                  <span className="crm-label">
                    Longitud
                  </span>

                  <input
                    className="crm-input"
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
                    disabled={formDisabled}
                    aria-disabled={formDisabled}
                  />
                </label>

                <label className="crm-form-group crm-form-group--full">
                  <span className="crm-label">
                    Permiso CRE / ASEA
                  </span>

                  <input
                    className="crm-input"
                    type="text"
                    value={form.cre_asea_permit}
                    onChange={(event) =>
                      handleChange(
                        'cre_asea_permit',
                        event.target.value,
                      )
                    }
                    placeholder="Número de permiso"
                    disabled={formDisabled}
                    aria-disabled={formDisabled}
                  />
                </label>

                {createMutation.isError && (
                  <div
                    className="crm-modal-notice crm-modal-notice--error crm-form-group--full"
                    role="alert"
                  >
                    No fue posible crear la
                    instalación. Verifique la
                    información e intente
                    nuevamente.
                  </div>
                )}

                {(clientsQuery.isError ||
                  installationTypesQuery.isError) && (
                  <div
                    className="crm-modal-notice crm-modal-notice--error crm-form-group--full"
                    role="alert"
                  >
                    No fue posible cargar los
                    datos necesarios para
                    registrar la instalación.
                  </div>
                )}

                <div className="crm-form-actions crm-form-group--full">
                  <button
                    type="button"
                    className="crm-btn crm-btn--secondary"
                    onClick={handleCancel}
                    disabled={formDisabled}
                    aria-disabled={formDisabled}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="crm-btn crm-btn--primary"
                    disabled={!canSubmit}
                    aria-disabled={!canSubmit}
                  >
                    {createMutation.isPending
                      ? 'Guardando...'
                      : 'Crear instalación'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {installationsQuery.isError && (
          <div
            className="crm-modal-notice crm-modal-notice--error"
            role="alert"
          >
            No fue posible cargar las
            instalaciones.
          </div>
        )}

        <section className="crm-panel">
          <header className="crm-panel__header">
            <div className="crm-panel__heading">
              <span className="crm-eyebrow">
                REGISTRO OPERATIVO
              </span>

              <h2 className="crm-panel__title">
                Instalaciones registradas
              </h2>
            </div>

            <div className="crm-panel__meta">
              {installationsQuery.isLoading
                ? 'Cargando'
                : `${installations.length} registros`}
            </div>
          </header>

          <div className="crm-panel__body">
            <CommercialTable
              headers={[
                'Cliente',
                'Tipo',
                'Dirección',
                'GPS',
                'CRE / ASEA',
              ]}
            >
              {installationsQuery.isLoading ? (
                <tr className="crm-table__tr">
                  <td
                    colSpan={5}
                    className="crm-table__td"
                  >
                    Cargando instalaciones...
                  </td>
                </tr>
              ) : installations.length === 0 ? (
                <tr className="crm-table__tr">
                  <td
                    colSpan={5}
                    className="crm-table__td"
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
                    const client:
                      | Client
                      | undefined =
                      installation.client_id
                        ? clientsById.get(
                            installation.client_id,
                          )
                        : undefined

                    const type:
                      | InstallationType
                      | undefined =
                      installation.installation_type_id
                        ? typesById.get(
                            installation.installation_type_id,
                          )
                        : undefined

                    const prospect =
                      prospectsByInstallationId.get(
                        installation.id,
                      )

                    const installationAddress = [
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
                        className="crm-table__tr"
                      >
                        <td className="crm-table__td crm-table__td--primary">
                          {client?.business_name ??
                            prospect?.business_name ??
                            'Sin cliente'}
                        </td>

                        <td className="crm-table__td">
                          {type?.name ?? '—'}
                        </td>

                        <td className="crm-table__td">
                          {installationAddress}
                        </td>

                        <td className="crm-table__td">
                          {installation.gps_lat &&
                          installation.gps_lng
                            ? `${installation.gps_lat}, ${installation.gps_lng}`
                            : '—'}
                        </td>

                        <td className="crm-table__td">
                          {installation.cre_asea_permit ??
                            '—'}
                        </td>
                      </tr>
                    )
                  },
                )
              )}
            </CommercialTable>
          </div>
        </section>
      </div>
    </main>
  )
}
