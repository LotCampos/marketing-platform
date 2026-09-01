import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom'

import CommercialLayout from '../modules/commercial/components/CommercialLayout'

import CommercialDashboardPage from '../modules/commercial/pages/CommercialDashboardPage'
import ProspectsPage from '../modules/commercial/pages/ProspectsPage'
import ProspectDetailPage from '../modules/commercial/pages/ProspectDetailPage'
import OpportunitiesPage from '../modules/commercial/pages/OpportunitiesPage'
import QuotationsPage from '../modules/commercial/pages/QuotationsPage'

import LoginPage from '../modules/identity/pages/LoginPage'

import ProtectedRoute from './auth/ProtectedRoute'

function CommercialRouteLayout() {
  return (
    <CommercialLayout>
      <Outlet />
    </CommercialLayout>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<CommercialRouteLayout />}>
            <Route
              path="/commercial"
              element={
                <CommercialDashboardPage />
              }
            />

            <Route
              path="/commercial/prospects"
              element={<ProspectsPage />}
            />

            <Route
              path="/commercial/prospects/:prospectId"
              element={<ProspectDetailPage />}
            />

            <Route
              path="/commercial/opportunities"
              element={
                <OpportunitiesPage />
              }
            />

            <Route
              path="/commercial/quotations"
              element={
                <QuotationsPage />
              }
            />


          </Route>
        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to="/commercial"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/commercial"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
