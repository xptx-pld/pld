import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HabitCollectionPage from './pages/HabitCollectionPage'
import DashboardPage from './pages/DashboardPage'
import GovernancePage from './pages/GovernancePage'
import InsightsPage from './pages/InsightsPage'
import NegotiationPage from './pages/NegotiationPage'
import PreferencesPage from './pages/PreferencesPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthStore } from './stores/authStore'
import './App.css'

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.checkAuth())
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function NewUserRoute() {
  const isNewUser = useAuthStore((s) => s.isNewUser)
  if (isNewUser) return <Navigate to="/habits" replace />
  return <Outlet />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/habits" element={<HabitCollectionPage />} />
          <Route element={<NewUserRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/governance" element={<GovernancePage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/negotiation" element={<NegotiationPage />} />
              <Route path="/preferences" element={<PreferencesPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
