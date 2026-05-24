import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function ProtectedRoute() {
  // 临时跳过登录验证，方便测试
  // const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  // if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
