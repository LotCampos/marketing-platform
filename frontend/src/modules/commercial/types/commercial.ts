export interface ServiceCatalog {
  is_active: unknown
  id: string
  service_code: string
  service_name: string
  description: string | null
  regulatory_basis: string | null
}

export interface ServiceRequest {
  id: string
  created_at: string
  version_lock: number
  client_id: string
  installation_id: string | null
  service_catalog_id: string
  request_number: string
  requested_at: string
  requested_by_name: string | null
  requested_by_email: string | null
  requested_by_phone: string | null
  request_description: string | null
  created_by: string | null
}

export interface CreateServiceRequestInput {
  client_id: string
  installation_id: string | null
  service_catalog_id: string
  request_number: string
  requested_by_name: string
  requested_by_email: string
  requested_by_phone: string
  request_description: string
}

export interface CapacityAssessment {
  id: string
  created_at: string
  version_lock: number
  service_request_id: string
  assessment_number: string
  status: string
  assessed_by: string
  assessed_at: string | null
  technical_capacity: boolean
  personnel_capacity: boolean
  equipment_capacity: boolean
  schedule_capacity: boolean
  observations: string
  rejection_reason: string
}

export interface Opportunity {
  id: string
  created_at: string
  version_lock: number
  opportunity_number: string
  service_request_id: string
  client_id: string
  assigned_to: string | null
  title: string
  description: string
  estimated_value: string | null
}

export interface Quotation {
  id: string
  created_at: string
  version_lock: number
  quotation_number: string
  opportunity_id: string
  client_id: string
  issued_by: string
  issue_date: string
  valid_until: string | null
  subtotal: string
  tax_amount: string
  total_amount: string
  currency: string
  notes: string | null
}

export interface QuotationItem {
  id: string
  created_at: string
  version_lock: number
  quotation_id: string
  service_catalog_id: string
  description: string
  quantity: string
  unit_price: string
  line_total: string
}

export interface Agreement {
  id: string
  created_at: string
  version_lock: number
  agreement_number: string
  quotation_id: string
  opportunity_id: string
  client_id: string
  status: string
  signed_by: string | null
  signed_at: string | null
  effective_from: string | null
  effective_until: string | null
  terms_hash: string | null
  notes: string | null
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

export interface CommercialCollection<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ProspectStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL'
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

  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null

  source: string | null
  status: ProspectStatus

  assigned_to: string | null

  interest_description: string | null
  notes: string | null

  converted_client_id: string | null
  converted_at: string | null
  converted_by: string | null
}

export interface CreateProspectInput {
  business_name: string
  rfc?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  source?: string | null
  assigned_to?: string | null
  interest_description?: string | null
  notes?: string | null
}

export interface ChangeProspectStatusInput {
  status: ProspectStatus
  expected_version: number
}

export interface AssignProspectInput {
  assigned_to: string
  expected_version: number
}