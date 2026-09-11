import {
  httpGet,
  httpGetBlob,
  httpPatch,
  httpPost,
} from './httpClient'

import type { IdentityUser } from './identity/identityApi'

import type {
  Agreement,
  AgreementTerm,
  CapacityAssessment,
  Client,
  CommercialCollection,
  CreateOpportunityInput,
  CreateProspectInput,
  CreateQuotationInput,
  CreateServiceRequestInput,
  Installation,
  InstallationType,
  Opportunity,
  Prospect,
  ProspectStatus,
  Quotation,
  QuotationItem,
  ServiceCatalog,
  ServiceRequest,
} from '../../modules/commercial/types/commercial'

const commercialPath = '/commercial'
const identityPath = '/identity'



export function getIdentityUsers() {
  return httpGet<CommercialCollection<IdentityUser>>(
    `${identityPath}/users/`,
  )
}

/* =========================================================
   SERVICE REQUESTS
========================================================= */

export function getServiceRequests() {
  return httpGet<
    CommercialCollection<ServiceRequest>
  >(
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

/* =========================================================
   PROSPECTS
========================================================= */

export function getProspects() {
  return httpGet<
    CommercialCollection<Prospect>
  >(
    `${commercialPath}/prospects/`,
  )
}

export function getProspect(
  prospectId: string,
) {
  return httpGet<Prospect>(
    `${commercialPath}/prospects/${prospectId}/`,
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
  data: {
    status: ProspectStatus
    expected_version: number
  },
) {
  return httpPost<Prospect>(
    `${commercialPath}/prospects/${prospectId}/change-status/`,
    data,
  )
}

export function assignProspect(
  prospectId: string,
  data: {
    assigned_to: string
    expected_version: number
  },
) {
  return httpPost<Prospect>(
    `${commercialPath}/prospects/${prospectId}/assign/`,
    data,
  )
}

/* =========================================================
   CAPACITY ASSESSMENTS
========================================================= */

export function getCapacityAssessments() {
  return httpGet<
    CommercialCollection<CapacityAssessment>
  >(
    `${commercialPath}/capacity-assessments/`,
  )
}

/* =========================================================
   OPPORTUNITIES
========================================================= */

export function getOpportunities() {
  return httpGet<
    CommercialCollection<Opportunity>
  >(
    `${commercialPath}/opportunities/`,
  )
}



export function createOpportunity(
  data: CreateOpportunityInput,
) {
  return httpPost<Opportunity>(
    `${commercialPath}/opportunities/`,
    data,
  )
}
/* =========================================================
   QUOTATIONS
========================================================= */

export function getQuotations() {
  return httpGet<
    CommercialCollection<Quotation>
  >(
    `${commercialPath}/quotations/`,
  )
}

export function createQuotation(
  data: CreateQuotationInput,
) {
  return httpPost<Quotation>(
    `${commercialPath}/quotations/`,
    data,
  )
}

export function getQuotationPdf(
  quotationId: string,
): Promise<Blob> {
  return httpGetBlob(
    `${commercialPath}/quotations/${quotationId}/pdf/`,
  )
}

/* =========================================================
   QUOTATION ITEMS
========================================================= */

export function getQuotationItems() {
  return httpGet<
    CommercialCollection<QuotationItem>
  >(
    `${commercialPath}/quotation-items/`,
  )
}

/* =========================================================
   AGREEMENTS
========================================================= */

export function getAgreements() {
  return httpGet<
    CommercialCollection<Agreement>
  >(
    `${commercialPath}/agreements/`,
  )
}

/* =========================================================
   AGREEMENT TERMS
========================================================= */

export function getAgreementTerms() {
  return httpGet<
    CommercialCollection<AgreementTerm>
  >(
    `${commercialPath}/agreement-terms/`,
  )
}

/* =========================================================
   MASTER DATA USED BY COMMERCIAL
========================================================= */

export function getClients() {
  return httpGet<
    Client[] | CommercialCollection<Client>
  >(
    '/master/clients/',
  )
}

export function getInstallations() {
  return httpGet<
    Installation[] | CommercialCollection<Installation>
  >(
    '/master/installations/',
  )
}

export function createInstallation(
  data: {
    client_id: string
    installation_type_id?: string | null
    address?: string | null
    street?: string | null
    street_number?: string | null
    state?: string | null
    municipality?: string | null
    postal_code?: string | null
    gps_lat?: string | null
    gps_lng?: string | null
    cre_asea_permit?: string | null
  },
) {
  return httpPost<Installation>(
    '/master/installations/',
    data,
  )
}

export function getInstallation(
  installationId: string,
) {
  return httpGet<Installation>(
    `/master/installations/${installationId}/`,
  )
}

export function updateInstallation(
  installationId: string,
  data: {
    client_id?: string | null
    installation_type_id?: string | null
    address?: string | null
    street?: string | null
    street_number?: string | null
    state?: string | null
    municipality?: string | null
    postal_code?: string | null
    gps_lat?: string | null
    gps_lng?: string | null
    cre_asea_permit?: string | null
  },
) {
  return httpPatch<Installation>(
    `/master/installations/${installationId}/`,
    data,
  )
}

export function getInstallationTypes() {
  return httpGet<
    InstallationType[] | CommercialCollection<InstallationType>
  >(
    '/master/installation-types/',
  )
}

export function getServiceCatalog() {
  return httpGet<
    ServiceCatalog[] | CommercialCollection<ServiceCatalog>
  >(
    '/master/service-catalog/',
  )
}