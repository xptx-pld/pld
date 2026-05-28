import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isGatePassed = sessionStorage.getItem('gate_passed') === 'true'

  if (!isGatePassed) return <Navigate to="/gate" replace />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
