import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码')
      return
    }

    try {
      setLoading(true)
      setError('')
      const result = await authService.loginWithEmail(email, password)
      localStorage.setItem('access_token', result.access_token)
      localStorage.setItem('refresh_token', result.refresh_token)
      setUser({ user_id: result.user_id, username: result.username } as any)

      // 检查是否已完成习惯收集
      const habitsCompleted = localStorage.getItem('habits_completed')
      navigate(habitsCompleted ? '/dashboard' : '/habits')
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneLogin = async () => {
    if (!phone || !password) {
      setError('请输入电话和密码')
      return
    }

    try {
      setLoading(true)
      setError('')
      const result = await authService.loginWithPhone(phone, password)
      localStorage.setItem('access_token', result.access_token)
      localStorage.setItem('refresh_token', result.refresh_token)
      setUser({ user_id: result.user_id, username: result.username } as any)

      // 检查是否已完成习惯收集
      const habitsCompleted = localStorage.getItem('habits_completed')
      navigate(habitsCompleted ? '/dashboard' : '/habits')
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          寝室自治系统
        </h1>
        <p className="text-center text-gray-600 mb-8">登录你的账户</p>

        {/* 登录方式选择 */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setLoginType('email')}
            className={`flex-1 py-2 px-4 rounded transition ${loginType === 'email'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            📧 邮箱
          </button>
          <button
            onClick={() => setLoginType('phone')}
            className={`flex-1 py-2 px-4 rounded transition ${loginType === 'phone'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            📱 电话
          </button>
        </div>

        {/* 邮箱登录 */}
        {loginType === 'email' && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="user@example.com"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="请输入密码"
              />
            </div>

            <button
              onClick={handleEmailLogin}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? '登录中...' : '使用邮箱登录'}
            </button>
          </>
        )}

        {/* 电话登录 */}
        {loginType === 'phone' && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">电话号码</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="13800138000"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="请输入密码"
              />
            </div>

            <button
              onClick={handlePhoneLogin}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? '登录中...' : '使用电话登录'}
            </button>
          </>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <p className="text-center text-gray-600 mt-6">
          没有账户？{' '}
          <a href="/register" className="text-blue-500 hover:underline">
            立即注册
          </a>
        </p>
      </div>
    </div>
  )
}
