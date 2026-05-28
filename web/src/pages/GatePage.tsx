import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// 邀请码配置 - 修改这里设置你的邀请码
const VALID_CODES = ['dorm2026', 'test123']

export default function GatePage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 检查是否已通过门禁
  const isPassed = sessionStorage.getItem('gate_passed') === 'true'
  if (isPassed) {
    navigate('/login', { replace: true })
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    setTimeout(() => {
      if (VALID_CODES.includes(code.trim())) {
        sessionStorage.setItem('gate_passed', 'true')
        navigate('/login', { replace: true })
      } else {
        setError('邀请码无效')
        setLoading(false)
      }
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🏠 寝室自治系统</h1>
          <p className="text-gray-500 mt-2">请输入邀请码访问系统</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入邀请码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            {loading ? '验证中...' : '进入系统'}
          </button>
        </form>
      </div>
    </div>
  )
}
