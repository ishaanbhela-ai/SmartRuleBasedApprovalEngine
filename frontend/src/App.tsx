import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/Dashboard/Dashboard'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import UserManagement from './pages/Dashboard/UserManagement'
import RequestTypesPage from './pages/Dashboard/RequestTypes'
import RulesPage from './pages/Dashboard/Rules'
import RequestsPage from './pages/Dashboard/Requests'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="users" element={<UserManagement />} />
              </Route>
              <Route path="request-types" element={<RequestTypesPage />} />
              <Route path="rules" element={<RulesPage />} />
              <Route path="requests" element={<RequestsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
