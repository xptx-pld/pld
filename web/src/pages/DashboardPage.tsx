import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authService, UserProfile } from '../services/auth'
import { useAuthStore } from '../stores/authStore'

const features = [
  { icon: '📊', title: '行为洞察', desc: '查看行为分析报告', path: '/insights', color: 'from-blue-500 to-blue-600' },
  { icon: '🤝', title: '博弈协商', desc: '参与利益协商', path: '/negotiation', color: 'from-purple-500 to-purple-600' },
  { icon: '🏛️', title: '自治治理', desc: '参与寝室治理', path: '/governance', color: 'from-orange-500 to-orange-600' },
  { icon: '⚙️', title: '偏好设置', desc: '管理个人偏好', path: '/preferences', color: 'from-gray-500 to-gray-600' },
]

export default function DashboardPage() {
  const { user, setUser, roomId, setRoomId } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [roomInput, setRoomInput] = useState(roomId || '')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getUserProfile()
        setProfile(data)
        setUser(data)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    if (!user) {
      fetchProfile()
    } else {
      setProfile(user)
      setLoading(false)
    }
  }, [user, setUser])

  const handleSetRoom = () => {
    if (roomInput.trim()) {
      setRoomId(roomInput.trim())
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 12) return '早上好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  return (
    <div className="space-y-6">
      {/* 欢迎卡片 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">{getGreeting()}，{profile?.username}！</h2>
        <p className="text-blue-100 text-sm">欢迎回到寝室智能自治系统</p>
        <div className="mt-4 flex gap-4">
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <p className="text-xs text-blue-100">信用积分</p>
            <p className="text-xl font-bold">{profile?.credit_score ?? 100}</p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <p className="text-xs text-blue-100">寝室</p>
            <p className="text-xl font-bold">{roomId || '未设置'}</p>
          </div>
        </div>
      </div>

      {/* 寝室ID设置 */}
      {!roomId ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏠</span>
            <div>
              <p className="font-bold text-yellow-800">加入你的寝室</p>
              <p className="text-sm text-yellow-600">设置寝室ID后即可使用完整功能</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="例如 R_401"
              className="flex-1 border border-yellow-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none bg-white"
            />
            <button
              onClick={handleSetRoom}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition"
            >
              确认
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-sm text-green-700">当前寝室: <strong className="text-green-800">{roomId}</strong></span>
          </div>
          <button
            onClick={() => setRoomId(null)}
            className="text-xs text-green-600 hover:text-green-800 underline"
          >
            更换
          </button>
        </div>
      )}

      {/* 用户信息卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">{profile?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">用户名</p>
              <p className="font-bold text-gray-800">{profile?.username}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600">📧</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">邮箱</p>
              <p className="font-bold text-gray-800">{profile?.email || '未绑定'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600">⭐</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">信用积分</p>
              <p className="font-bold text-gray-800">{profile?.credit_score ?? 100} / 100</p>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${profile?.credit_score ?? 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 功能入口 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">功能模块</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <Link
              key={f.path}
              to={f.path}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="text-2xl">{f.icon}</span>
              </div>
              <p className="font-bold text-gray-800 mb-1">{f.title}</p>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
