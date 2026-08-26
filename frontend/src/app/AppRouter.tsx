import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import CommercialDashboardPage from '../modules/commercial/pages/CommercialDashboardPage'
import ServiceRequestsPage from '../modules/commercial/pages/ServiceRequestsPage'
import OpportunitiesPage from '../modules/commercial/pages/OpportunitiesPage'
import ProspectsPage from '../modules/commercial/pages/ProspectsPage'
import QuotationsPage from '../modules/commercial/pages/QuotationsPage'
import AgreementsPage from '../modules/commercial/pages/AgreementsPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/commercial" replace />} />

        <Route path="/commercial" element={<CommercialDashboardPage />} />
        <Route
          path="/commercial/service-requests"
          element={<ServiceRequestsPage />}
        />
        <Route
          path="/commercial/opportunities"
          element={<OpportunitiesPage />}
        />
        <Route
          path="/commercial/prospects"
          element={<ProspectsPage />}
        />  
        <Route
          path="/commercial/quotations"
          element={<QuotationsPage />}
        />
        <Route
          path="/commercial/agreements"
          element={<AgreementsPage />}
        />

        <Route path="*" element={<Navigate to="/commercial" replace />} />
      </Routes>
    </BrowserRouter>
  )
}