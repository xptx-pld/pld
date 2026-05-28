import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import GatePage from './pages/GatePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HabitCollectionPage from './pages/HabitCollectionPage'
import DashboardPage from './pages/DashboardPage'
import GovernancePage from './pages/GovernancePage'
import InsightsPage from './pages/InsightsPage'
import NegotiationPage from './pages/NegotiationPage'
import PreferencesPage from './pages/PreferencesPage'
import AdminPage from './pages/AdminPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthStore } from './stores/authStore'
import './App.css'

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function NewUserRoute() {
  const isNewUser = useAuthStore((s) => s.isNewUser)
  if (isNewUser) return <Navigate to="/habits" replace />
  return <Outlet />
}

function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isGatePassed = sessionStorage.getItem('gate_passed') === 'true'

  if (!isGatePassed) return <Navigate to="/gate" replace />
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
}

function GateRoute({ children }: { children: React.ReactNode }) {
  const isPassed = sessionStorage.getItem('gate_passed') === 'true'
  if (!isPassed) return <Navigate to="/gate" replace />
  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/gate" element={<GatePage />} />
        <Route path="/login" element={<GateRoute><GuestRoute><LoginPage /></GuestRoute></GateRoute>} />
        <Route path="/register" element={<GateRoute><GuestRoute><RegisterPage /></GuestRoute></GateRoute>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/habits" element={<HabitCollectionPage />} />
          <Route element={<NewUserRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/governance" element={<GovernancePage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/negotiation" element={<NegotiationPage />} />
              <Route path="/preferences" element={<PreferencesPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </Router>
  )
}

export default App
