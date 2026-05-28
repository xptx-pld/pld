import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authService, UserProfile } from '../services/auth'
import { roomService, RoomMember, Activity, RankingItem } from '../services/room'
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
  const [members, setMembers] = useState<RoomMember[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'members' | 'activities' | 'ranking'>('members')

  // 房间操作状态
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomCapacity, setNewRoomCapacity] = useState(4)
  const [joinRoomId, setJoinRoomId] = useState('')
  const [roomActionLoading, setRoomActionLoading] = useState(false)

  const getErrorMessage = (err: any): string => {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((d: any) => d.msg || String(d)).join('; ')
    if (detail && typeof detail === 'object') return detail.msg || JSON.stringify(detail)
    return '操作失败'
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await authService.getUserProfile()
        setProfile(data)
        setUser(data)

        if (data.room_id) {
          try {
            const [membersRes, activitiesRes, rankingRes] = await Promise.all([
              roomService.getMembers(),
              roomService.getActivities(),
              roomService.getRanking(),
            ])
            setMembers(membersRes.members)
            setActivities(activitiesRes.activities)
            setRanking(rankingRes.ranking)
          } catch (roomErr: any) {
            console.error('获取寝室数据失败:', roomErr)
          }
        }
      } catch (err: any) {
        console.error('获取用户信息失败:', err)
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      setError('请输入寝室名称')
      return
    }
    try {
      setRoomActionLoading(true)
      setError('')
      const result = await roomService.createRoom(newRoomName.trim(), newRoomCapacity)
      setRoomId(result.room_id)
      setShowCreateRoom(false)
      setNewRoomName('')
      // 刷新数据
      window.location.reload()
    } catch (err: any) {
      setError(getErrorMessage(err))
    } finally {
      setRoomActionLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      setError('请输入寝室ID')
      return
    }
    try {
      setRoomActionLoading(true)
      setError('')
      const result = await roomService.joinRoom(joinRoomId.trim())
      setRoomId(result.room_id)
      setShowJoinRoom(false)
      setJoinRoomId('')
      window.location.reload()
    } catch (err: any) {
      setError(getErrorMessage(err))
    } finally {
      setRoomActionLoading(false)
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

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
        </div>
      )}

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
            <p className="text-xl font-bold">{roomId || '未加入'}</p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <p className="text-xs text-blue-100">成员</p>
            <p className="text-xl font-bold">{members.length}</p>
          </div>
        </div>
      </div>

      {/* 寝室加入/创建 */}
      {!roomId ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🏠</span>
            <div>
              <p className="font-bold text-yellow-800">加入或创建寝室</p>
              <p className="text-sm text-yellow-600">创建新寝室或加入已有寝室</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setShowCreateRoom(true); setShowJoinRoom(false) }}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition"
            >
              创建寝室
            </button>
            <button
              onClick={() => { setShowJoinRoom(true); setShowCreateRoom(false) }}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition"
            >
              加入寝室
            </button>
          </div>

          {/* 创建寝室表单 */}
          {showCreateRoom && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
              <h4 className="font-bold text-gray-800 mb-3">创建新寝室</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="寝室名称（如：401温馨小窝）"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <select
                  value={newRoomCapacity}
                  onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value={2}>2人寝室</option>
                  <option value={3}>3人寝室</option>
                  <option value={4}>4人寝室</option>
                  <option value={6}>6人寝室</option>
                  <option value={8}>8人寝室</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateRoom}
                    disabled={roomActionLoading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    {roomActionLoading ? '创建中...' : '确认创建'}
                  </button>
                  <button
                    onClick={() => setShowCreateRoom(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 加入寝室表单 */}
          {showJoinRoom && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
              <h4 className="font-bold text-gray-800 mb-3">加入已有寝室</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="输入寝室ID（如 R_401）"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleJoinRoom}
                    disabled={roomActionLoading}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition disabled:opacity-50"
                  >
                    {roomActionLoading ? '加入中...' : '确认加入'}
                  </button>
                  <button
                    onClick={() => setShowJoinRoom(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-sm text-green-700">当前寝室: <strong className="text-green-800">{roomId}</strong></span>
          </div>
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

      {/* 寝室详情 */}
      {roomId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              👥 成员 ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === 'activities' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📋 最近活动
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === 'ranking' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🏆 排行榜
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'members' && (
              <div className="space-y-3">
                {members.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">暂无成员数据</p>
                ) : (
                  members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">{member.username[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{member.username}</p>
                          <p className="text-xs text-gray-500">
                            {member.is_email_verified ? '✓ 已验证' : '未验证'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{member.credit_score}</p>
                        <p className="text-xs text-gray-500">信用积分</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">暂无活动记录</p>
                ) : (
                  activities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl mt-0.5">{activity.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(activity.time)}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'ranking' && (
              <div className="space-y-3">
                {ranking.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">暂无排行数据</p>
                ) : (
                  ranking.map((item) => (
                    <div
                      key={item.user_id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        item.is_self ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl w-10 text-center">{getRankBadge(item.rank)}</span>
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.username}
                            {item.is_self && <span className="text-xs text-blue-600 ml-2">(我)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-blue-600">{item.credit_score}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
