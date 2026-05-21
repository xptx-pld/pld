import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import { useAuthStore } from '../stores/authStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser, setIsLoading } = useAuthStore()
  const [step, setStep] = useState<'choice' | 'email' | 'phone'>('choice')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  // 发送邮箱OTP
  const handleSendEmailOTP = async () => {
    if (!email) {
      setError('请输入邮箱')
      return
    }

    try {
      setLoading(true)
      setError('')
      await authService.sendEmailOTP(email)
      setOtpSent(true)
      setError('验证码已发送到你的邮箱')
    } catch (err: any) {
      setError(err.response?.data?.detail || '发送验证码失败')
    } finally {
      setLoading(false)
    }
  }

  // 邮箱注册
  const handleEmailRegister = async () => {
    if (!password) {
      setError('请输入密码')
      return
    }
    if (!otp) {
      setError('请输入验证码')
      return
    }

    try {
      setLoading(true)
      setError('')
      const result = await authService.registerWithEmail(email, otp, password)
      localStorage.setItem('access_token', result.access_token)
      localStorage.setItem('refresh_token', result.refresh_token)
      setUser({ user_id: result.user_id, username: result.username } as any)
      navigate('/habits')
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  // 发送电话OTP
  const handleSendPhoneOTP = async () => {
    if (!phone) {
      setError('请输入电话号码')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await authService.sendPhoneOTP(phone)
      setOtpSent(true)
      // 虚拟模式 - 直接从响应中获取OTP用于演示
      setError(`演示模式 - OTP: ${response.message}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || '发送验证码失败')
    } finally {
      setLoading(false)
    }
  }

  // 电话注册
  const handlePhoneRegister = async () => {
    if (!password) {
      setError('请输入密码')
      return
    }
    if (!otp) {
      setError('请输入验证码')
      return
    }

    try {
      setLoading(true)
      setError('')
      const result = await authService.registerWithPhone(phone, otp, password)
      localStorage.setItem('access_token', result.access_token)
      localStorage.setItem('refresh_token', result.refresh_token)
      setUser({ user_id: result.user_id, username: result.username } as any)
      navigate('/habits')
    } catch (err: any) {
      setError(err.response?.data?.detail || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            寝室自治系统
          </h1>
          <p className="text-center text-gray-600 mb-8">选择注册方式</p>

          <button
            onClick={() => setStep('email')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg mb-4 transition"
          >
            📧 邮箱注册
          </button>

          <button
            onClick={() => setStep('phone')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            📱 电话注册
          </button>

          <p className="text-center text-gray-600 mt-6">
            已有账户？{' '}
            <a href="/login" className="text-blue-500 hover:underline">
              立即登录
            </a>
          </p>
        </div>
      </div>
    )
  }

  if (step === 'email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">📧 邮箱注册</h1>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={otpSent}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              placeholder="user@example.com"
            />
          </div>

          {!otpSent ? (
            <button
              onClick={handleSendEmailOTP}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? '发送中...' : '发送验证码'}
            </button>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">验证码</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="请输入验证码"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="至少6个字符"
                />
              </div>

              <button
                onClick={handleEmailRegister}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? '注册中...' : '完成注册'}
              </button>
            </>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            onClick={() => {
              setStep('choice')
              setError('')
              setOtpSent(false)
              setEmail('')
              setPassword('')
              setOtp('')
            }}
            className="w-full mt-4 text-gray-600 hover:text-gray-800 text-center"
          >
            ← 返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">📱 电话注册</h1>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">电话号码</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={otpSent}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 disabled:bg-gray-100"
            placeholder="13800138000"
          />
        </div>

        {!otpSent ? (
          <button
            onClick={handleSendPhoneOTP}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? '发送中...' : '发送验证码'}
          </button>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">验证码</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="请输入验证码"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="至少6个字符"
              />
            </div>

            <button
              onClick={handlePhoneRegister}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? '注册中...' : '完成注册'}
            </button>
          </>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={() => {
            setStep('choice')
            setError('')
            setOtpSent(false)
            setPhone('')
            setPassword('')
            setOtp('')
          }}
          className="w-full mt-4 text-gray-600 hover:text-gray-800 text-center"
        >
          ← 返回
        </button>
      </div>
    </div>
  )
}
