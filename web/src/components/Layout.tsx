import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const navItems = [
  { path: '/dashboard', label: '首页', icon: '🏠' },
  { path: '/preferences', label: '偏好', icon: '⚙️' },
  { path: '/insights', label: '洞察', icon: '📊' },
  { path: '/negotiation', label: '协商', icon: '🤝' },
  { path: '/governance', label: '治理', icon: '🏛️' },
  { path: '/admin', label: '管理', icon: '🛡️' },
]

export default function Layout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkClass = (isActive: boolean) =>
    `flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-sm transition ${
      isActive
        ? 'text-blue-600 bg-blue-50 font-bold'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">🏠 寝室自治系统</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 桌面端侧边栏 */}
        <aside className="hidden md:flex flex-col w-56 bg-white shadow-sm min-h-[calc(100vh-3.5rem)] p-3 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => linkClass(isActive)}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* 移动端底部导航栏 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => linkClass(isActive)}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
