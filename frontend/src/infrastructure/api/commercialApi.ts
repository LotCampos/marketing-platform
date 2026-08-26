import { httpGet, httpPost } from './httpClient'

import type {
  Agreement,
  AgreementTerm,
  CapacityAssessment,
  CommercialCollection,
  CreateServiceRequestInput,
  Opportunity,
  Prospect,
  CreateProspectInput,
  ChangeProspectStatusInput,
  AssignProspectInput,
  Quotation,
  QuotationItem,
  ServiceRequest,
} from '../../modules/commercial/types/commercial'

import type { ServiceCatalog } from '../../modules/master/types/master'

const commercialPath = '/commercial'
const masterPath = '/master'

export function getServiceCatalog() {
  return httpGet<CommercialCollection<ServiceCatalog>>(
    `${masterPath}/service-catalog/`,
  )
}

export function getServiceRequests() {
  return httpGet<CommercialCollection<ServiceRequest>>(
    `${commercialPath}/service-requests/`,
  )
}

export function createServiceRequest(
  data: CreateServiceRequestInput,
) {
  return httpPost<ServiceRequest>(
    `${commercialPath}/service-requests/`,
    data,
  )
}

export function getCapacityAssessments() {
  return httpGet<CommercialCollection<CapacityAssessment>>(
    `${commercialPath}/capacity-assessments/`,
  )
}

export function getOpportunities() {
  return httpGet<CommercialCollection<Opportunity>>(
    `${commercialPath}/opportunities/`,
  )
}

export function getQuotations() {
  return httpGet<CommercialCollection<Quotation>>(
    `${commercialPath}/quotations/`,
  )
}

export function getQuotationItems() {
  return httpGet<CommercialCollection<QuotationItem>>(
    `${commercialPath}/quotation-items/`,
  )
}

export function getAgreements() {
  return httpGet<CommercialCollection<Agreement>>(
    `${commercialPath}/agreements/`,
  )
}

export function getAgreementTerms() {
  return httpGet<CommercialCollection<AgreementTerm>>(
    `${commercialPath}/agreement-terms/`,
  )
}

export function getProspects() {
  return httpGet<CommercialCollection<Prospect>>(
    `${commercialPath}/prospects/`,
  )
}

export function createProspect(
  data: CreateProspectInput,
) {
  return httpPost<Prospect>(
    `${commercialPath}/prospects/`,
    data,
  )
}

export function changeProspectStatus(
  prospectId: string,
  data: ChangeProspectStatusInput,
) {
  return httpPost<Prospect>(
    `${commercialPath}/prospects/${prospectId}/change-status/`,
    data,
  )
}

export function assignProspect(
  prospectId: string,
  data: AssignProspectInput,
) {
  return httpPost<Prospect>(
    `${commercialPath}/prospects/${prospectId}/assign/`,
    data,
  )
}