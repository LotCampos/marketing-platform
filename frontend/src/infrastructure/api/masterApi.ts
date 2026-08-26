import { httpGet } from './httpClient'
import type {
  Client,
  Installation,
  MasterCollection,
  ServiceCatalog,
} from '../../modules/master/types/master'

const masterPath = '/master'

export function getClients() {
  return httpGet<Client[] | MasterCollection<Client>>(
    `${masterPath}/clients/`,
  )
}

export function getInstallations() {
  return httpGet<Installation[] | MasterCollection<Installation>>(
    `${masterPath}/installations/`,
  )
}

export function getServiceCatalog() {
  return httpGet<ServiceCatalog[] | MasterCollection<ServiceCatalog>>(
    `${masterPath}/service-catalog/`,
  )
}