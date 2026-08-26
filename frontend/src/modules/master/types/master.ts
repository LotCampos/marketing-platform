export interface Client {
  id: string
  rfc: string
  business_name: string
}

export interface Installation {
  id: string
  client_id: string
  address: string
  gps_lat: string | null
  gps_lng: string | null
  cre_asea_permit: string | null
}

export interface ServiceCatalog {
  id: string
  service_code: string
  service_name: string
  description: string | null
  regulatory_basis: string | null
  is_active: boolean
}

export interface MasterCollection<T> {
  results: T[]
  count?: number
  next?: string | null
  previous?: string | null
}