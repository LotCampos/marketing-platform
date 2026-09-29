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
  getServiceCatalog,
} from '../../../infrastructure/api/commercialApi'

interface ProspectFormProps {
  onSubmit: (data: CreateProspectInput) => void
  onCancel: () => void
  isPending: boolean
}

const initialFormData: CreateProspectInput = {
  business_name: '',
  rfc: '',
  service_catalog_id: '',
  installation_type_id: '',
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
  const serviceCatalogQuery = useQuery({
    queryKey: ['master', 'service-catalog'],
    queryFn: getServiceCatalog,
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

    setFormData((previous) => {
      if (name === 'service_catalog_id') {
        return {
          ...previous,
          service_catalog_id: value,
          installation_type_id: '',
        }
      }

      return {
        ...previous,
        [name]: value,
      }
    })
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

      service_catalog_id:
        formData.service_catalog_id,

      installation_type_id:
        formData.installation_type_id,

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
      formData.business_name.trim() &&
      formData.service_catalog_id &&
      formData.installation_type_id,
    )

  const serviceCatalog = serviceCatalogQuery.data
    ? Array.isArray(serviceCatalogQuery.data)
      ? serviceCatalogQuery.data
      : serviceCatalogQuery.data.results
    : []

  const selectedService = serviceCatalog.find(
    (service) =>
      service.id === formData.service_catalog_id,
  )

  return (
    
    <form 
    onSubmit={handleSubmit}
    >
      
      <header className="crm-panel__header">
        <div className="crm-panel-heading">
          <span className="crm-eyebrow">
            NUEVO REGISTRO
          </span>

          <h2 className="crm-text-h2">
            Formulario de prospecto
          </h2>

          <p className="crm-text-body">
            Registre una prospecto potencial
            antes de convertirlo en cliente.
          </p>
        </div>
      </header>

    <div className="crm-form__body">

       <section className="crm-form-section">
          <header className="crm-panel-title">
            <span className="crm-eyebrow">
              01 / EMPRESA
            </span>

            <h3 className="crm-text-h2">
              Identificación empresarial
            </h3>

            <p className="crm-text-body">
              Información principal del prospecto.
            </p>
        </header>

        <div className="crm-form-grid">
          <div className="crm-form-group">
            <label className="crm-label" htmlFor="business_name">
             Razón social / empresa
             </label>
 
            <input
              className="crm-input"
              type="text"
              id="business_name"
              name="business_name"
              required
              maxLength={255}
              value={formData.business_name}
              onChange={handleChange}
              disabled={isPending}
              aria-disabled={isPending}
              placeholder="Nombre o razón social"
            />
            </div>
          
          <div className="crm-form-group">
          <label className="crm-label" htmlFor="rfc">
              RFC <em>opcional</em>
            </label>

            <input
              className="crm-input"
              type="text"
              id="rfc"
              name="rfc"
              maxLength={13}
              value={formData.rfc ?? ''}
              onChange={handleChange}
              disabled={isPending}
              aria-disabled={isPending}
              placeholder="RFC del prospecto"
            />
          </div>

          <div className="crm-form-group">
            <label className="crm-label" htmlFor="service_catalog_id">
              Servicio
            </label>

            <select
              className="crm-select"
              id="service_catalog_id"
              name="service_catalog_id"
              required
              value={formData.service_catalog_id}
              onChange={handleChange}
              disabled={
                isPending ||
                serviceCatalogQuery.isLoading
              }
              aria-disabled={
                isPending ||
                serviceCatalogQuery.isLoading
              }
            >
              <option value="">
                Seleccione un servicio
              </option>

              {serviceCatalog.map((service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.service_name}
                </option>
              ))}
            </select>
          </div>

          <div className="crm-form-group">
            <label className="crm-label" htmlFor="installation_type_id">
              Tipo de instalación
              </label>

            <select
              className="crm-select"
              id="installation_type_id"
              name="installation_type_id"
              required
              value={
                formData.installation_type_id
              }
              onChange={handleChange}
              disabled={
                isPending ||
                serviceCatalogQuery.isLoading ||
                !formData.service_catalog_id
              }
              aria-disabled={
                isPending ||
                serviceCatalogQuery.isLoading ||
                !formData.service_catalog_id
              }
            >
              <option value="">
                {formData.service_catalog_id
                  ? 'Seleccione un tipo de instalación'
                  : 'Seleccione primero un servicio'}
              </option>

              {selectedService?.installation_types.map(
                (installationType) => (
                  <option
                    key={installationType.id}
                    value={installationType.id}
                  >
                    {installationType.name}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
        
      </section>
      
        <section className="crm-form-section">
          <div className="crm-panel-title">
            <span className="crm-eyebrow">
              02 / CONTACTO
            </span>

            <h3 className="crm-text-h2">
              Contacto
            </h3>

            <p className="crm-text-body">
              Datos de la persona de contacto.
            </p>
          </div>

        <div className="crm-form-grid">
          <div className="crm-form-group">
            <label className="crm-label" htmlFor="contact_name">
              Nombre de contacto <em>opcional</em>
            </label>

            <input
              className="crm-input"
              type="text"
              id="contact_name"
              name="contact_name"
              maxLength={255}
              value={formData.contact_name ?? ''}
              onChange={handleChange}
              disabled={isPending}
              aria-disabled={isPending}
              placeholder="Nombre completo"
            />
          </div>

          <div className="crm-form-group">
            <label className="crm-label" htmlFor="contact_email">
              Correo electrónico <em>opcional</em>
            </label>

            <input
              className="crm-input"
              type="email"
              id="contact_email"
              name="contact_email"
              maxLength={254}
              value={formData.contact_email ?? ''}
              onChange={handleChange}
              disabled={isPending}
              aria-disabled={isPending}
              placeholder="correo@empresa.com"
            />
          </div>

        <div className="crm-form-group">
            <label className="crm-label" htmlFor="contact_phone"> 
              Teléfono <em>opcional</em>
            </label>

            <input
              className="crm-input"
              type="text"
              id="contact_phone"
              name="contact_phone"
              maxLength={50}
              value={formData.contact_phone ?? ''}
              onChange={handleChange}
              disabled={isPending}
              aria-disabled={isPending}
              placeholder="+52 55 0000 0000"
            />
          </div>

          <div className="crm-form-group">
            <label className="crm-label" htmlFor="source">
              Fuente <em>opcional</em>
            </label>

            <input
              className="crm-input"
              type="text"
              id="source"
              name="source"
              maxLength={100}
              value={formData.source ?? ''}
              onChange={handleChange}
              disabled={isPending}
              aria-disabled={isPending}
              placeholder="Web, referido, evento, campaña..."
            />
          </div>
            
      </div>
    </section>

      <section className="crm-form-section">
          <div className="crm-panel-title">
            <label className="crm-eyebrow">
              04 / INTERÉS COMERCIAL
            </label>

            <h3 className="crm-text-h2">
              Interés comercial
            </h3>

            <p className="crm-text-body">
              Necesidad o servicio de interés identificado.
            </p>
          </div>
      
        <div className="crm-form-grid">
          <div className="crm-form-group">
            <label className="crm-label" htmlFor="interest_description">
              Descripción del interés <em>opcional</em>
            </label>

            <textarea
              className="crm-textarea"
              id="interest_description"
              name="interest_description"
              rows={4}
              value={
                formData.interest_description ?? ''
              }
              onChange={handleChange}
              disabled={isPending}
              aria-disabled={isPending}
              placeholder="Describa el servicio, necesidad, proyecto o requerimiento identificado."
            />
          </div>

          <div className="crm-form-group">
              <label className="crm-label" htmlFor="interest_description">
              Notas <em>opcional</em>
              </label>

            <textarea
              className="crm-textarea"
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes ?? ''}
              onChange={handleChange}
              disabled={isPending}
              aria-disabled={isPending}
              placeholder="Agregue información relevante para el seguimiento comercial."
            />
          </div>
        </div>
      </section>
    </div>
  
      <footer className="crm-panel__footer">
        <div className="crm-form-required">
          <span aria-hidden="true">*</span>{' '}
          Campos obligatorios
        </div>

        <div className="crm-panel__actions">
          <button
            type="button"
            className="crm-btn crm-btn--secondary"
            onClick={onCancel}
            disabled={isPending}
            aria-disabled={isPending}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="crm-btn crm-btn--primary"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            aria-live="polite"
          >
            {isPending
              ? 'Registrando...'
              : 'Crear prospecto'}
          </button>
        </div>
      </footer>
    </form>
  )
}