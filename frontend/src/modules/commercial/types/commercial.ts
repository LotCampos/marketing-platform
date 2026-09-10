export interface CommercialCollection<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Client {
  id: string
  created_at: string
  version_lock: number
  business_name: string
  rfc: string | null
  installation_type: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  is_active: boolean
}

export interface Installation {
  id: string
  client_id: string | null
  installation_type_id: string | null
  address: string | null
  street: string | null
  street_number: string | null
  state: string | null
  municipality: string | null
  postal_code: string | null
  gps_lat: string | null
  gps_lng: string | null
  cre_asea_permit: string | null
}

export interface InstallationType {
  id: string
  created_at: string
  version_lock: number
  code: string
  name: string
  is_active: boolean
}

export interface ServiceCatalog {
  id: string
  created_at: string
  version_lock: number
  service_code: string
  service_name: string
  description: string | null
  regulatory_basis: string | null
  is_active: boolean
  installation_types: InstallationType[]
}

export interface ServiceRequest {
  id: string
  created_at: string
  version_lock: number
  client_id: string
  installation_id: string | null
  request_number: string
  requested_by_name: string | null
  requested_by_email: string | null
  requested_by_phone: string | null
  description: string | null
  status: string
  is_deleted: boolean
  deleted_at: string | null
  deleted_by: string | null
  deletion_reason: string | null
}

export interface CreateServiceRequestInput {
  client_id: string
  installation_id?: string | null
  service_catalog_id: string
  request_number: string
  requested_by_name?: string | null
  requested_by_email?: string | null
  requested_by_phone?: string | null
  request_description?: string | null
}

export type ProspectStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'QUOTED'
  | 'WON'
  | 'LOST'
  | 'CONVERTED'

export interface Prospect {
  id: string
  created_at: string
  version_lock: number
  prospect_number: string
  business_name: string
  rfc: string | null
  service_catalog_id: string | null
  installation: string | null
  installation_type_detail: InstallationType | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  source: string | null
  interest_description: string | null
  notes: string | null
  status: ProspectStatus
  assigned_to: string | null
  converted_client_id: string | null
}

export interface CreateProspectInput {
  business_name: string
  rfc?: string | null
  service_catalog_id: string
  installation_type_id: string
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  source?: string | null
  interest_description?: string | null
  notes?: string | null
  assigned_to?: string | null
}

export interface CapacityAssessment {
  id: string
  created_at: string
  version_lock: number
  service_request_id: string | null
  assessed_by: string | null
  assessed_at: string | null
  technical_capacity: boolean | null
  personnel_capacity: boolean | null
  equipment_capacity: boolean | null
  schedule_capacity: boolean | null
  observations: string | null
  rejection_reason: string | null
}

export interface Opportunity {
  id: string
  created_at: string
  version_lock: number
  opportunity_number: string
  prospect: string | null
  service_request_id: string | null
  client_id: string | null
  assigned_to: string | null
  title: string
  description: string | null
  estimated_value: string | null
}

export interface CreateOpportunityInput {
  opportunity_number: string
  prospect_id?: string | null
  service_request_id?: string | null
  client_id?: string | null
  title: string
  assigned_to?: string | null
  description?: string | null
  estimated_value?: string | null
}

export interface CreateQuotationItemInput {
  service_catalog_id: string
  description: string
  quantity: string
  unit_price: string
}

export interface CreateQuotationInput {
  quotation_number: string
  opportunity_id: string
  client_id?: string | null
  issued_by?: string | null
  valid_until?: string | null
  currency?: string
  notes?: string | null
  tax_percentage?: string
  items: CreateQuotationItemInput[]
}

export interface QuotationItem {
  id: string
  quotation_id: string
  service_catalog_id: string
  description: string
  quantity: string
  unit_price: string
  line_total: string
  version_lock: number
  created_at: string
}

export interface Quotation {
  id: string
  quotation_number: string
  opportunity_id: string
  client_id: string | null
  issued_by: string | null
  valid_until: string | null
  subtotal: string
  tax_amount: string
  total_amount: string
  currency: string
  notes: string | null
  version_lock: number
  created_at: string
  items: QuotationItem[]
}

export interface Agreement {
  id: string
  created_at: string
  version_lock: number
  opportunity_id: string
  quotation_id: string
  client_id: string
  agreement_number: string
  status: string
  signed_at: string | null
  effective_from: string | null
  effective_until: string | null
  starts_at: string | null
  ends_at: string | null
}

export interface AgreementTerm {
  id: string
  created_at: string
  version_lock: number
  agreement_id: string
  term_code: string
  term_description: string
  is_mandatory: boolean
}