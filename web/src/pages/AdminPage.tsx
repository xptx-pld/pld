import { useState, useEffect } from 'react'
import apiClient from '../services/api'

interface ViolationItem {
  id: number
  room_id: string
  reporter_id: string
  reporter_name: string
  violator_id: string
  violator_name: string
  rule_type: string
  evidence_log: string
  evidence_images: string[]
  status: string
  ai_score: number | null
  ai_decision: string | null
  ai_analysis: string | null
  appeal_reason: string | null
  appeal_status: string | null
  deducted_points: number
  created_at: string
}

interface UserItem {
  user_id: string
  username: string
  email: string | null
  phone: string | null
  room_id: string | null
  credit_score: number
  role: string
  is_banned: boolean
  created_at: string
}

interface RoomItem {
  room_id: string
  room_name: string
  capacity: number
  current_cycle: string | null
  member_count: number
  created_at: string
}

const statusLabels: Record<string, { text: string; color: string }> = {
  pending_analysis: { text: '待AI分析', color: 'bg-yellow-100 text-yellow-700' },
  analyzed: { text: 'AI已通过', color: 'bg-green-100 text-green-700' },
  ai_failed: { text: 'AI分析失败', color: 'bg-red-100 text-red-700' },
  deducted: { text: '已扣分', color: 'bg-gray-100 text-gray-600' },
  appealed: { text: '申诉中', color: 'bg-orange-100 text-orange-700' },
  reviewed: { text: '已审核', color: 'bg-blue-100 text-blue-700' },
  evidence_required: { text: '需补证', color: 'bg-purple-100 text-purple-700' },
}

export default function AdminPage() {
  const [tab, setTab] = useState<'violations' | 'users' | 'rooms'>('violations')
  const [violations, setViolations] = useState<ViolationItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reviewNote, setReviewNote] = useState<Record<number, string>>({})

  useEffect(() => {
    if (tab === 'violations') fetchViolations()
    else if (tab === 'users') fetchUsers()
    else if (tab === 'rooms') fetchRooms()
  }, [tab])

  const fetchViolations = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/api/v1/admin/violations')
      setViolations(res.data.data.items || [])
    } catch {
      setError('获取违约列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/api/v1/admin/users')
      setUsers(res.data.data.users || [])
    } catch {
      setError('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/api/v1/admin/rooms')
      setRooms(res.data.data.rooms || [])
    } catch {
      setError('获取寝室列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (violationId: number, action: string) => {
    try {
      await apiClient.post('/api/v1/admin/violations/review', {
        violation_id: violationId,
        action,
        note: reviewNote[violationId] || '',
      })
      fetchViolations()
    } catch {
      setError('审核失败')
    }
  }

  const handleAddAdmin = async (userId: string) => {
    try {
      await apiClient.post('/api/v1/admin/add-admin', { user_id: userId })
      fetchUsers()
    } catch {
      setError('添加管理员失败')
    }
  }

  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      await apiClient.post('/api/v1/admin/ban-user', { user_id: userId, ban })
      fetchUsers()
    } catch {
      setError('操作失败')
    }
  }

  const handleDissolveRoom = async (roomId: string) => {
    if (!confirm(`确定要解散寝室 ${roomId} 吗？所有成员将被移出。`)) return
    try {
      await apiClient.post(`/api/v1/admin/rooms/${roomId}/dissolve`)
      fetchRooms()
    } catch {
      setError('解散寝室失败')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">管理员后台</h2>
        <p className="text-sm text-gray-500 mt-1">审核违约、管理用户和寝室</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex gap-1">
        {[
          { key: 'violations' as const, label: '违约审核', icon: '📋' },
          { key: 'users' as const, label: '用户管理', icon: '👥' },
          { key: 'rooms' as const, label: '寝室管理', icon: '🏠' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setError('') }}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === t.key ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">x</button>
        </div>
      )}

      {/* 违约审核 */}
      {tab === 'violations' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
          ) : violations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无待审核记录</div>
          ) : (
            violations.map((v) => (
              <div key={v.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusLabels[v.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[v.status]?.text || v.status}
                      </span>
                      {v.appeal_status === 'pending' && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">有申诉</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{v.reporter_name}</span> 举报 <span className="font-medium">{v.violator_name}</span>
                      {' · '}规则: {v.rule_type}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(v.created_at)}</p>
                  </div>
                  {v.ai_score !== null && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">AI评分</p>
                      <p className={`text-lg font-bold ${v.ai_score >= 0.7 ? 'text-green-600' : v.ai_score >= 0.4 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {(v.ai_score * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700">{v.evidence_log}</p>
                </div>

                {v.evidence_images.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {v.evidence_images.map((url, i) => (
                      <img key={i} src={url} alt={`证据${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-105 transition" />
                    ))}
                  </div>
                )}

                {v.appeal_reason && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-orange-700 mb-1">申诉理由</p>
                    <p className="text-sm text-orange-800">{v.appeal_reason}</p>
                  </div>
                )}

                {v.ai_analysis && (
                  <details className="mb-3">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">查看AI分析报告</summary>
                    <pre className="mt-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 whitespace-pre-wrap">{v.ai_analysis}</pre>
                  </details>
                )}

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={reviewNote[v.id] || ''}
                    onChange={(e) => setReviewNote({ ...reviewNote, [v.id]: e.target.value })}
                    placeholder="审核备注（可选）"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button onClick={() => handleReview(v.id, 'uphold')} className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg transition">维持扣分</button>
                  <button onClick={() => handleReview(v.id, 'overturn')} className="bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition">撤销</button>
                  <button onClick={() => handleReview(v.id, 'request_evidence')} className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded-lg transition">要求补证</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 用户管理 */}
      {tab === 'users' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">邮箱/手机</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">寝室</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">积分</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">角色</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">状态</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{u.username}</p>
                        <p className="text-xs text-gray-400">{u.user_id}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email || u.phone || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{u.room_id || '-'}</td>
                      <td className="px-4 py-3 text-center font-medium text-gray-800">{u.credit_score}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'admin' ? '管理员' : '用户'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {u.is_banned ? '已封禁' : '正常'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          {u.role !== 'admin' && (
                            <>
                              <button onClick={() => handleAddAdmin(u.user_id)} className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1">设为管理员</button>
                              <button onClick={() => handleBanUser(u.user_id, !u.is_banned)} className={`text-xs px-2 py-1 ${u.is_banned ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}>
                                {u.is_banned ? '解封' : '封禁'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 寝室管理 */}
      {tab === 'rooms' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">暂无寝室</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((r) => (
                <div key={r.room_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-gray-800">{r.room_name}</h4>
                      <p className="text-xs text-gray-400">{r.room_id}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{r.member_count}/{r.capacity}人</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>当前周期: {r.current_cycle || '无'}</span>
                    <span>{formatDate(r.created_at)}</span>
                  </div>
                  <button
                    onClick={() => handleDissolveRoom(r.room_id)}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 text-sm py-2 rounded-lg transition"
                  >
                    解散寝室
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
