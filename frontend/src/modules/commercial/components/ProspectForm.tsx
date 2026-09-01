import './commercial-forms.css'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type {
  ChangeEvent,
  FormEvent,
} from 'react'

import type {
  CreateProspectInput,
} from '../types/commercial'

import {
  getInstallationTypes,
} from '../../../infrastructure/api/commercialApi'

interface ProspectFormProps {
  onSubmit: (data: CreateProspectInput) => void
  onCancel: () => void
  isPending: boolean
}

const initialFormData: CreateProspectInput = {
  business_name: '',
  rfc: '',
  installation_type: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  source: '',
  assigned_to: '',
  interest_description: '',
  notes: '',
}

export default function ProspectForm({
  onSubmit,
  onCancel,
  isPending,
}: ProspectFormProps) {

  const installationTypesQuery =
    useQuery({
      queryKey: ['master', 'installation-types'],
      queryFn: getInstallationTypes,
      staleTime: 5 * 60 * 1000,
    })

  const [formData, setFormData] =
    useState<CreateProspectInput>(
      initialFormData,
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

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    onSubmit({
      business_name:
        formData.business_name.trim(),

      rfc:
        formData.rfc?.trim() || null,
      installation_type:
        formData.installation_type?.trim() || null,

      contact_name:
        formData.contact_name?.trim() || null,

      contact_email:
        formData.contact_email?.trim() || null,

      contact_phone:
        formData.contact_phone?.trim() || null,

      source:
        formData.source?.trim() || null,

      assigned_to:
        formData.assigned_to?.trim() || null,

      interest_description:
        formData.interest_description?.trim() || null,

      notes:
        formData.notes?.trim() || null,
    })
  }

  const canSubmit =
    !isPending &&
    Boolean(
      formData.business_name.trim(),
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
              d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            />

            <circle
              cx="9"
              cy="7"
              r="4"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 8v6m3-3h-6"
            />
          </svg>
        </div>

        <div className="form-intro-content">
          <span className="form-eyebrow">
            NUEVO REGISTRO
          </span>

          <h3 className="form-title">
            Nuevo prospecto
          </h3>

          <p className="form-subtitle">
            Registre una oportunidad comercial potencial
            antes de convertirla en cliente.
          </p>
        </div>
      </div>

      {/* =====================================================
          01 — EMPRESA
      ====================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span className="form-section-number">
            01
          </span>

          <div>
            <h4>
              Identificación empresarial
            </h4>

            <p>
              Información principal del prospecto.
            </p>
          </div>
        </div>

        <div className="form-grid form-grid-2">
          <div className="form-field">
            <label htmlFor="business_name">
              Razón social / empresa
              <span>*</span>
            </label>

            <input
              type="text"
              id="business_name"
              name="business_name"
              required
              maxLength={255}
              value={
                formData.business_name
              }
              onChange={handleChange}
              disabled={isPending}
              placeholder="Nombre o razón social"
            />
          </div>

          <div className="form-field">
            <label htmlFor="rfc">
              RFC
              <em>opcional</em>
            </label>

            <input
              type="text"
              id="rfc"
              name="rfc"
              maxLength={13}
              value={
                formData.rfc ?? ''
              }
              onChange={handleChange}
              disabled={isPending}
              placeholder="RFC del prospecto"
            />
          </div>

          <div className="form-field">
            <label htmlFor="installation_type">
              Tipo de instalación
              <em>opcional</em>
            </label>

            <select
              id="installation_type"
              name="installation_type"
              value={
                formData.installation_type ?? ''
              }
              onChange={handleChange}
              disabled={
                isPending ||
                installationTypesQuery.isLoading
              }
            >
              <option value="">
                Seleccione un tipo de instalación
              </option>

              {installationTypesQuery.data &&
                (
                  Array.isArray(
                    installationTypesQuery.data,
                  )
                    ? installationTypesQuery.data
                    : installationTypesQuery.data.results
                ).map((installationType) => (
                  <option
                    key={installationType.id}
                    value={installationType.id}
                  >
                    {installationType.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </section>

      {/* =====================================================
          02 — CONTACTO
      ====================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span className="form-section-number">
            02
          </span>

          <div>
            <h4>Contacto</h4>

            <p>
              Datos de la persona de contacto.
            </p>
          </div>
        </div>

        <div className="form-grid form-grid-2">
          <div className="form-field">
            <label htmlFor="contact_name">
              Nombre de contacto
              <em>opcional</em>
            </label>

            <input
              type="text"
              id="contact_name"
              name="contact_name"
              maxLength={255}
              value={
                formData.contact_name ?? ''
              }
              onChange={handleChange}
              disabled={isPending}
              placeholder="Nombre completo"
            />
          </div>

          <div className="form-field">
            <label htmlFor="contact_email">
              Correo electrónico
              <em>opcional</em>
            </label>

            <input
              type="email"
              id="contact_email"
              name="contact_email"
              maxLength={254}
              value={
                formData.contact_email ?? ''
              }
              onChange={handleChange}
              disabled={isPending}
              placeholder="correo@empresa.com"
            />
          </div>

          <div className="form-field">
            <label htmlFor="contact_phone">
              Teléfono
              <em>opcional</em>
            </label>

            <input
              type="text"
              id="contact_phone"
              name="contact_phone"
              maxLength={50}
              value={
                formData.contact_phone ?? ''
              }
              onChange={handleChange}
              disabled={isPending}
              placeholder="+52 55 0000 0000"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          03 — ORIGEN Y ASIGNACIÓN
      ====================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span className="form-section-number">
            03
          </span>

          <div>
            <h4>
              Origen y asignación
            </h4>

            <p>
              Procedencia comercial y responsable
              del seguimiento.
            </p>
          </div>
        </div>

        <div className="form-grid form-grid-2">
          <div className="form-field">
            <label htmlFor="source">
              Fuente
              <em>opcional</em>
            </label>

            <input
              type="text"
              id="source"
              name="source"
              maxLength={100}
              value={
                formData.source ?? ''
              }
              onChange={handleChange}
              disabled={isPending}
              placeholder="Web, referido, evento, campaña..."
            />
          </div>

          <div className="form-field">
            <label htmlFor="assigned_to">
              Responsable
              <em>opcional</em>
            </label>

            <input
              type="text"
              id="assigned_to"
              name="assigned_to"
              maxLength={255}
              value={
                formData.assigned_to ?? ''
              }
              onChange={handleChange}
              disabled={isPending}
              placeholder="Usuario responsable"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          04 — INTERÉS COMERCIAL
      ====================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span className="form-section-number">
            04
          </span>

          <div>
            <h4>
              Interés comercial
            </h4>

            <p>
              Necesidad o servicio de interés identificado.
            </p>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="interest_description">
            Descripción del interés
            <em>opcional</em>
          </label>

          <textarea
            id="interest_description"
            name="interest_description"
            rows={4}
            value={
              formData.interest_description ?? ''
            }
            onChange={handleChange}
            disabled={isPending}
            placeholder="Describa el servicio, necesidad, proyecto o requerimiento identificado."
          />
        </div>
      </section>

      {/* =====================================================
          05 — NOTAS
      ====================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span className="form-section-number">
            05
          </span>

          <div>
            <h4>
              Notas comerciales
            </h4>

            <p>
              Información adicional para seguimiento.
            </p>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="notes">
            Notas
            <em>opcional</em>
          </label>

          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={
              formData.notes ?? ''
            }
            onChange={handleChange}
            disabled={isPending}
            placeholder="Agregue información relevante para el seguimiento comercial."
          />
        </div>
      </section>

      {/* =====================================================
          ESTADO INICIAL
      ====================================================== */}

      <section className="form-status">
        <div>
          <span className="form-status-label">
            ESTADO INICIAL
          </span>

          <strong>
            NEW
          </strong>
        </div>

        <p>
          El prospecto se registra inicialmente como
          <strong> NEW</strong>. Los cambios de estado
          deberán realizarse mediante la operación de
          workflow correspondiente.
        </p>
      </section>

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

                Crear prospecto
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
