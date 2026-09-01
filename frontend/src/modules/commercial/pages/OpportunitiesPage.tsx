import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import './opportunities-page.css'

import {
  createOpportunity,
  getClients,
  getIdentityUsers,
  getOpportunities,
  getServiceRequests,
} from '../../../infrastructure/api/commercialApi'

import CommercialTable from '../../../shared/components/CommercialTable'

import type {
  Client,
  CommercialCollection,
  CreateOpportunityInput,
  IdentityUser,
  Opportunity,
  ServiceRequest,
} from '../types/commercial'

function collectionResults<T>(
  data:
    | T[]
    | CommercialCollection<T>
    | undefined,
): T[] {
  if (!data) {
    return []
  }

  return Array.isArray(data)
    ? data
    : data.results
}

function getClientLabel(
  client: Client,
): string {
  if (client.business_name) {
    return client.rfc
      ? `${client.business_name} — ${client.rfc}`
      : client.business_name
  }

  return client.rfc ?? client.id
}

function getServiceRequestLabel(
  request: ServiceRequest,
): string {
  const requester =
    request.requested_by_name?.trim()

  return requester
    ? `${request.request_number} — ${requester}`
    : request.request_number
}

function getUserLabel(
  user: IdentityUser,
): string {
  return user.employee_number
    ? `${user.full_name} — ${user.employee_number}`
    : user.full_name
}

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'No fue posible completar la operación.'
}

export default function OpportunitiesPage() {
  const queryClient = useQueryClient()

  const [isFormOpen, setIsFormOpen] =
    useState(false)

  const [
    opportunityNumber,
    setOpportunityNumber,
  ] = useState('')

  const [
    serviceRequestId,
    setServiceRequestId,
  ] = useState('')

  const [clientId, setClientId] =
    useState('')

  const [assignedTo, setAssignedTo] =
    useState('')

  const [title, setTitle] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [
    estimatedValue,
    setEstimatedValue,
  ] = useState('')

  const opportunitiesQuery = useQuery({
    queryKey: [
      'commercial',
      'opportunities',
    ],
    queryFn: getOpportunities,
  })

  const serviceRequestsQuery =
    useQuery({
      queryKey: [
        'commercial',
        'service-requests',
      ],
      queryFn: getServiceRequests,
    })

  const clientsQuery = useQuery({
    queryKey: [
      'master',
      'clients',
    ],
    queryFn: getClients,
  })

  const usersQuery = useQuery({
    queryKey: [
      'identity',
      'users',
    ],
    queryFn: getIdentityUsers,
  })

  const createMutation = useMutation({
    mutationFn: (
      data: CreateOpportunityInput,
    ) => createOpportunity(data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          'commercial',
          'opportunities',
        ],
      })

      resetForm()
    },
  })

  const opportunities =
    opportunitiesQuery.data?.results ?? []

  const serviceRequests = useMemo(
    () =>
      serviceRequestsQuery.data?.results ??
      [],
    [serviceRequestsQuery.data],
  )

  const clients = useMemo(
    () =>
      collectionResults<Client>(
        clientsQuery.data,
      ),
    [clientsQuery.data],
  )

  const users = useMemo(
    () =>
      usersQuery.data?.results ?? [],
    [usersQuery.data],
  )

  const selectedClient = useMemo(
    () =>
      clients.find(
        (client) =>
          client.id === clientId,
      ),
    [clients, clientId],
  )

  const isLoadingDependencies =
    serviceRequestsQuery.isLoading ||
    clientsQuery.isLoading ||
    usersQuery.isLoading

  function resetForm() {
    setOpportunityNumber('')
    setServiceRequestId('')
    setClientId('')
    setAssignedTo('')
    setTitle('')
    setDescription('')
    setEstimatedValue('')
    setIsFormOpen(false)
  }

  function handleServiceRequestChange(
    value: string,
  ) {
    setServiceRequestId(value)

    const request =
      serviceRequests.find(
        (item) => item.id === value,
      )

    if (request) {
      setClientId(request.client_id)
    } else {
      setClientId('')
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!serviceRequestId) {
      return
    }

    if (!selectedClient) {
      return
    }

    const payload: CreateOpportunityInput = {
      opportunity_number:
        opportunityNumber.trim(),

      service_request_id:
        serviceRequestId,

      client_id:
        selectedClient.id,

      title:
        title.trim(),

      assigned_to:
        assignedTo || null,

      description:
        description.trim() || null,

      estimated_value:
        estimatedValue.trim() || null,
    }

    createMutation.mutate(payload)
  }

  return (
    <div className="opportunities-page">
      <header className="opportunities-hero">
        <div>
          <span>
            COMERCIAL / PIPELINE
          </span>

          <h2>
            Oportunidades
          </h2>

          <p>
            Control integral del pipeline
            comercial, responsables, valor
            estimado y descripción de cada
            oportunidad.
          </p>
        </div>

        <div>
          <div className="opportunities-summary">
            <small>REGISTROS</small>

            <strong>
              {opportunitiesQuery.isLoading
                ? '—'
                : opportunitiesQuery.data
                    ?.count ?? 0}
            </strong>
          </div>

          <button
            type="button"
            onClick={() =>
              setIsFormOpen(
                (current) => !current,
              )
            }
            disabled={
              createMutation.isPending
            }
          >
            {isFormOpen
              ? 'Cerrar'
              : 'Nueva oportunidad'}
          </button>
        </div>
      </header>

      {isFormOpen && (
        <section className="opportunities-panel">
          <header className="opportunities-panel-header">
            <div>
              <span>
                ALTA COMERCIAL
              </span>

              <h3>
                Nueva oportunidad
              </h3>
            </div>
          </header>

          {isLoadingDependencies && (
            <p>
              Cargando información
              comercial...
            </p>
          )}

          <form
            onSubmit={handleSubmit}
          >
            <div>
              <label htmlFor="opportunity-number">
                Número de oportunidad
              </label>

              <input
                id="opportunity-number"
                value={opportunityNumber}
                onChange={(event) =>
                  setOpportunityNumber(
                    event.target.value,
                  )
                }
                required
              />
            </div>

            <div>
              <label htmlFor="service-request">
                Solicitud de servicio
              </label>

              <select
                id="service-request"
                value={serviceRequestId}
                onChange={(event) =>
                  handleServiceRequestChange(
                    event.target.value,
                  )
                }
                required
              >
                <option value="">
                  Seleccionar solicitud
                </option>

                {serviceRequests.map(
                  (request) => (
                    <option
                      key={request.id}
                      value={request.id}
                    >
                      {getServiceRequestLabel(
                        request,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label htmlFor="opportunity-client">
                Cliente
              </label>

              <select
                id="opportunity-client"
                value={clientId}
                onChange={(event) =>
                  setClientId(
                    event.target.value,
                  )
                }
                required
              >
                <option value="">
                  Seleccionar cliente
                </option>

                {clients.map(
                  (client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {getClientLabel(
                        client,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label htmlFor="opportunity-assigned-to">
                Responsable
              </label>

              <select
                id="opportunity-assigned-to"
                value={assignedTo}
                onChange={(event) =>
                  setAssignedTo(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Sin asignar
                </option>

                {users.map(
                  (user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {getUserLabel(user)}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label htmlFor="opportunity-title">
                Título
              </label>

              <input
                id="opportunity-title"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value,
                  )
                }
                required
              />
            </div>

            <div>
              <label htmlFor="opportunity-description">
                Descripción
              </label>

              <textarea
                id="opportunity-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                rows={4}
              />
            </div>

            <div>
              <label htmlFor="estimated-value">
                Valor estimado
              </label>

              <input
                id="estimated-value"
                type="number"
                min="0"
                step="0.01"
                value={estimatedValue}
                onChange={(event) =>
                  setEstimatedValue(
                    event.target.value,
                  )
                }
              />
            </div>

            {createMutation.isError && (
              <div
                role="alert"
                className="opportunities-error"
              >
                {getErrorMessage(
                  createMutation.error,
                )}
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={resetForm}
                disabled={
                  createMutation.isPending
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  isLoadingDependencies
                }
              >
                {createMutation.isPending
                  ? 'Guardando...'
                  : 'Crear oportunidad'}
              </button>
            </div>
          </form>
        </section>
      )}

      {opportunitiesQuery.isError && (
        <div
          className="opportunities-error"
          role="alert"
        >
          No fue posible cargar las
          oportunidades comerciales.
        </div>
      )}

      <section className="opportunities-panel">
        <header className="opportunities-panel-header">
          <div>
            <span>
              PIPELINE COMERCIAL
            </span>

            <h3>
              Registro de oportunidades
            </h3>
          </div>

          <div className="opportunities-count">
            {opportunitiesQuery.isLoading
              ? 'Cargando'
              : `${opportunities.length} registros`}
          </div>
        </header>

        <CommercialTable
          headers={[
            'Número',
            'Título',
            'Cliente',
            'Descripción',
            'Responsable',
            'Valor estimado',
          ]}
        >
          {opportunitiesQuery.isLoading ? (
            <tr>
              <td
                colSpan={6}
                className="empty-state"
              >
                Cargando oportunidades...
              </td>
            </tr>
          ) : opportunitiesQuery.isError ? (
            <tr>
              <td
                colSpan={6}
                className="empty-state"
              >
                No fue posible cargar las
                oportunidades.
              </td>
            </tr>
          ) : opportunities.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="empty-state"
              >
                No existen oportunidades
                registradas.
              </td>
            </tr>
          ) : (
            opportunities.map(
              (item: Opportunity) => {
                const client =
                  clients.find(
                    (candidate) =>
                      candidate.id ===
                      item.client_id,
                  )

                const responsible =
                  item.assigned_to
                    ? users.find(
                        (candidate) =>
                          candidate.id ===
                          item.assigned_to,
                      )
                    : null

                return (
                  <tr key={item.id}>
                    <td className="table-primary">
                      {
                        item.opportunity_number
                      }
                    </td>

                    <td>
                      {item.title}
                    </td>

                    <td>
                      {client
                        ? getClientLabel(
                            client,
                          )
                        : item.client_id}
                    </td>

                    <td>
                      <span className="opportunity-description">
                        {item.description ||
                          '—'}
                      </span>
                    </td>

                    <td>
                      {responsible
                        ? getUserLabel(
                            responsible,
                          )
                        : 'Sin asignar'}
                    </td>

                    <td>
                      {item.estimated_value ??
                        '—'}
                    </td>
                  </tr>
                )
              },
            )
          )}
        </CommercialTable>
      </section>
    </div>
  )
}
