import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import apiClient from '../services/api'
import {
  governanceService,
  ViolationResponse,
  InitiateRevisionResponse,
  NVCResponse,
  CovenantHistoryResponse,
  GovernanceVotesResponse,
} from '../services/governance'

const conflictTypes = [
  { value: 'LIGHT_AND_NOISE', label: '灯光与噪音' },
  { value: 'AC_TEMPERATURE', label: '空调温度' },
  { value: 'SCHEDULE_MISMATCH', label: '作息不一致' },
  { value: 'GENERAL', label: '综合' },
]

export default function GovernancePage() {
  const { roomId } = useAuthStore()
  const [tab, setTab] = useState<'violation' | 'revision' | 'nvc' | 'votes' | 'history'>('violation')

  // 违约表单
  const [violationForm, setViolationForm] = useState({
    violatorId: '',
    ruleType: 'LIGHTS_OFF',
    evidenceLog: '',
  })
  const [evidenceImages, setEvidenceImages] = useState<File[]>([])
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([])
  const [violationResult, setViolationResult] = useState<ViolationResponse | null>(null)

  // 修订结果
  const [revisionResult, setRevisionResult] = useState<InitiateRevisionResponse | null>(null)

  // NVC表单
  const [nvcForm, setNvcForm] = useState({
    conflictType: 'LIGHT_AND_NOISE',
    involvedParties: '',
    frictionCount: 3,
  })
  const [nvcResult, setNvcResult] = useState<NVCResponse | null>(null)

  // 投票和历史
  const [votes, setVotes] = useState<GovernanceVotesResponse | null>(null)
  const [history, setHistory] = useState<CovenantHistoryResponse | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tab === 'votes' && !votes && roomId) {
      fetchVotes()
    } else if (tab === 'history' && !history && roomId) {
      fetchHistory()
    }
  }, [tab])

  const fetchVotes = async () => {
    if (!roomId) return
    setLoading(true)
    setError('')
    try {
      const data = await governanceService.getActiveVotes(roomId)
      setVotes(data)
    } catch {
      setError('获取投票数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    if (!roomId) return
    setLoading(true)
    setError('')
    try {
      const data = await governanceService.getCovenantHistory(roomId)
      setHistory(data)
    } catch {
      setError('获取公约历史失败')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + evidenceImages.length > 5) {
      setError('最多上传5张图片')
      return
    }
    const newImages = [...evidenceImages, ...files].slice(0, 5)
    setEvidenceImages(newImages)
    // Generate previews
    const newPreviews = newImages.map(file => URL.createObjectURL(file))
    setEvidencePreviews(newPreviews)
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(evidencePreviews[index])
    setEvidenceImages(prev => prev.filter((_, i) => i !== index))
    setEvidencePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleViolation = async () => {
    if (!roomId) return
    setLoading(true)
    setError('')
    setViolationResult(null)
    try {
      // Upload images first if any
      let imageUrls: string[] = []
      if (evidenceImages.length > 0) {
        const formData = new FormData()
        evidenceImages.forEach(file => formData.append('images', file))
        const uploadRes = await apiClient.post('/api/v1/governance/upload-evidence', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrls = uploadRes.data.data.urls || []
      }

      const data = await governanceService.reportViolation({
        room_id: roomId,
        violator_id: violationForm.violatorId,
        rule_type: violationForm.ruleType,
        evidence_log: violationForm.evidenceLog,
        evidence_images: imageUrls,
      })
      setViolationResult(data)
      // Clean up
      evidencePreviews.forEach(url => URL.revokeObjectURL(url))
      setEvidenceImages([])
      setEvidencePreviews([])
    } catch {
      setError('上报违约失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRevision = async () => {
    if (!roomId) return
    setLoading(true)
    setError('')
    setRevisionResult(null)
    try {
      const data = await governanceService.initiateRevision(roomId)
      setRevisionResult(data)
    } catch {
      setError('发起修订失败')
    } finally {
      setLoading(false)
    }
  }

  const handleNVC = async () => {
    if (!roomId) return
    setLoading(true)
    setError('')
    setNvcResult(null)
    try {
      const data = await governanceService.generateNVCMediation({
        room_id: roomId,
        conflict_type: nvcForm.conflictType,
        involved_parties: nvcForm.involvedParties.split(',').map((s) => s.trim()).filter(Boolean),
        recent_friction_count: nvcForm.frictionCount,
      })
      setNvcResult(data)
    } catch {
      setError('生成调解话术失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCastVote = async (voteId: string, optionIndex: number) => {
    setLoading(true)
    setError('')
    try {
      await governanceService.castVote(voteId, optionIndex)
      fetchVotes()
    } catch {
      setError('投票失败')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'violation' as const, label: '上报违约', icon: '🚨' },
    { key: 'revision' as const, label: '发起修订', icon: '🔄' },
    { key: 'nvc' as const, label: 'NVC调解', icon: '💬' },
    { key: 'votes' as const, label: '治理投票', icon: '🗳️' },
    { key: 'history' as const, label: '公约历史', icon: '📜' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'PASSED': return 'bg-blue-100 text-blue-700'
      case 'SUPERSEDED': return 'bg-gray-100 text-gray-600'
      case 'REJECTED': return 'bg-red-100 text-red-700'
      case 'EXPIRED': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '生效中'
      case 'PASSED': return '已通过'
      case 'SUPERSEDED': return '已替代'
      case 'REJECTED': return '未通过'
      case 'EXPIRED': return '已过期'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">自治治理</h2>
        <p className="text-sm text-gray-500 mt-1">管理寝室公约、处理违约、调解冲突</p>
      </div>

      {/* 标签切换 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex gap-1 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setError('') }}
            className={`flex-1 min-w-[80px] px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === t.key ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {!roomId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          请先在首页设置寝室ID
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      {/* 上报违约 */}
      {tab === 'violation' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">🚨</span>
            </div>
            <h4 className="font-bold text-gray-800">上报违约</h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">违约者ID</label>
              <input
                type="text"
                value={violationForm.violatorId}
                onChange={(e) => setViolationForm({ ...violationForm, violatorId: e.target.value })}
                placeholder="U_123"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">规则类型</label>
              <select
                value={violationForm.ruleType}
                onChange={(e) => setViolationForm({ ...violationForm, ruleType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              >
                <option value="LIGHTS_OFF">熄灯 (-5分)</option>
                <option value="AC_TEMP">空调温度 (-3分)</option>
                <option value="NOISE">噪音 (-4分)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">证据记录</label>
              <textarea
                value={violationForm.evidenceLog}
                onChange={(e) => setViolationForm({ ...violationForm, evidenceLog: e.target.value })}
                rows={3}
                placeholder="请描述违约行为..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">拍照举证（可选，最多5张）</label>
              <div className="flex flex-wrap gap-3">
                {evidencePreviews.map((preview, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img src={preview} alt={`证据${index + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      x
                    </button>
                  </div>
                ))}
                {evidenceImages.length < 5 && (
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-red-400 transition">
                    <span className="text-2xl text-gray-400">+</span>
                    <span className="text-xs text-gray-400">添加</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">支持拍照或从相册选择，图片将作为违约证据提交</p>
            </div>
            <button
              onClick={handleViolation}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2.5 px-5 rounded-lg transition text-sm"
            >
              {loading ? '提交中...' : '🚨 提交违约'}
            </button>
            {violationResult && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-5">
                <p className="font-bold text-yellow-800 mb-2">📢 寝室法庭通告</p>
                <p className="text-sm text-yellow-700 mb-3">{violationResult.broadcastNotice}</p>
                {violationResult.evidenceImages && violationResult.evidenceImages.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {violationResult.evidenceImages.map((url, i) => (
                      <img key={i} src={url} alt={`证据${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-yellow-300" />
                    ))}
                  </div>
                )}
                <div className="flex gap-4 text-xs flex-wrap">
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full">
                    扣除 {violationResult.deductedPoints} 分
                  </span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    剩余 {violationResult.remainingCreditScore} 分
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    投票权重 {violationResult.votingWeightModifier}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 发起修订 */}
      {tab === 'revision' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">🔄</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-800">发起公约修订</h4>
              <p className="text-sm text-gray-500">发起新一轮公约迭代周期，系统将生成执行报告并开启投票</p>
            </div>
          </div>
          <button
            onClick={handleRevision}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 px-5 rounded-lg transition text-sm"
          >
            {loading ? '处理中...' : '🔄 发起修订'}
          </button>
          {revisionResult && (
            <div className="mt-4 bg-gray-50 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">周期ID</p>
                  <p className="font-medium text-gray-800">{revisionResult.cycleId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">投票ID</p>
                  <p className="font-medium text-gray-800">{revisionResult.voteSessionId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">状态</p>
                  <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    {revisionResult.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">违约总数</p>
                  <p className="font-medium text-gray-800">{revisionResult.executionReport.totalViolationsRecorded}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 mb-1">最大摩擦规则</p>
                <p className="text-sm font-medium text-gray-800 mb-2">{revisionResult.executionReport.mostFrictionRule}</p>
                <p className="text-xs text-gray-500 mb-1">行为趋势</p>
                <p className="text-sm text-gray-600">{revisionResult.executionReport.behaviorShiftTrend}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NVC调解 */}
      {tab === 'nvc' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">💬</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-800">NVC冲突调解</h4>
              <p className="text-sm text-gray-500">生成非暴力沟通调解话术</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">冲突类型</label>
              <select
                value={nvcForm.conflictType}
                onChange={(e) => setNvcForm({ ...nvcForm, conflictType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                {conflictTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">相关成员ID（逗号分隔）</label>
              <input
                type="text"
                value={nvcForm.involvedParties}
                onChange={(e) => setNvcForm({ ...nvcForm, involvedParties: e.target.value })}
                placeholder="U_123, U_456"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">近期摩擦次数</label>
              <input
                type="number"
                min={1}
                value={nvcForm.frictionCount}
                onChange={(e) => setNvcForm({ ...nvcForm, frictionCount: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={handleNVC}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-2.5 px-5 rounded-lg transition text-sm"
            >
              {loading ? '生成中...' : '💬 生成调解话术'}
            </button>
            {nvcResult && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                  <p className="font-bold text-green-700 mb-2">📝 调解叙事</p>
                  <p className="text-sm text-green-800 leading-relaxed">{nvcResult.mediationNarrative}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="font-bold text-gray-700 mb-3">🤝 过渡方案建议</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">关灯时间</span>
                      <span className="font-medium text-gray-800">{nvcResult.suggestedTransitionalPlan.lightsOffTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">空调温度</span>
                      <span className="font-medium text-gray-800">{nvcResult.suggestedTransitionalPlan.acTemp}°C</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">特别条款</span>
                      <span className="font-medium text-gray-800">{nvcResult.suggestedTransitionalPlan.specialClause}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 治理投票 */}
      {tab === 'votes' && (
        <div className="space-y-4">
          <button
            onClick={fetchVotes}
            disabled={loading || !roomId}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 px-5 rounded-xl transition text-sm"
          >
            {loading ? '加载中...' : '🗳️ 刷新投票'}
          </button>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}

          {votes && !loading && (
            <div className="space-y-4">
              {votes.votes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无进行中的投票</div>
              ) : (
                votes.votes.map((vote) => (
                  <div key={vote.voteId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-gray-800">{vote.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{vote.description}</p>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(vote.status)}`}>
                          {vote.voteType === 'REVISION' ? '修订' : vote.voteType === 'APPEAL' ? '申诉' : '投票'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                        <span>已投: {vote.totalVoted}/{vote.totalVoters}</span>
                        <span>截止: {new Date(vote.expiresAt).toLocaleString('zh-CN')}</span>
                      </div>

                      <div className="space-y-3">
                        {vote.options.map((opt) => {
                          const percentage = vote.totalVoted > 0 ? (opt.vote_count / vote.totalVoted) * 100 : 0
                          const canVote = vote.status === 'ACTIVE'
                          return (
                            <button
                              key={opt.index}
                              onClick={() => canVote && handleCastVote(vote.voteId, opt.index)}
                              disabled={!canVote || loading}
                              className={`w-full text-left p-4 rounded-xl border-2 transition ${
                                canVote
                                  ? 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                                  : 'border-gray-100 cursor-default'
                              }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-800">{opt.text}</span>
                                <span className="text-sm font-bold text-gray-700">{opt.vote_count}票</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-400">
                                  {opt.voter_ids.length > 0 ? opt.voter_ids.join(', ') : ''}
                                </span>
                                <span className="text-xs text-gray-500">{percentage.toFixed(0)}%</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 公约历史 */}
      {tab === 'history' && (
        <div className="space-y-4">
          <button
            onClick={fetchHistory}
            disabled={loading || !roomId}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 px-5 rounded-xl transition text-sm"
          >
            {loading ? '加载中...' : '📜 加载历史'}
          </button>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}

          {history && !loading && (
            <div className="space-y-4">
              {history.history.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无公约历史</div>
              ) : (
                history.history.map((cycle, index) => (
                  <div key={cycle.cycleId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            cycle.status === 'ACTIVE' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <span className="text-lg">{cycle.status === 'ACTIVE' ? '✅' : '📋'}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">周期 {cycle.cycleId}</h4>
                            <p className="text-xs text-gray-500">
                              {new Date(cycle.createdAt).toLocaleDateString('zh-CN')} · {cycle.plan.type}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(cycle.status)}`}>
                          {getStatusLabel(cycle.status)}
                        </span>
                      </div>

                      {/* 公约内容 */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-xs text-gray-500 mb-2">公约条款</p>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(cycle.plan.rules).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-gray-500">
                                {key === 'acTemp' ? '空调温度' :
                                 key === 'lightsOffTime' ? '熄灯时间' :
                                 key === 'noisePolicy' ? '噪音政策' :
                                 key === 'specialClause' ? '特别条款' : key}
                              </span>
                              <span className="font-medium text-gray-800">
                                {key === 'acTemp' ? `${value}°C` : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 投票结果 */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">投票结果</span>
                            <span className="font-medium text-gray-700">
                              {cycle.voteResult.agreeCount}/{cycle.voteResult.totalVoters} 同意
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                cycle.voteResult.status === 'PASSED'
                                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                                  : 'bg-gradient-to-r from-red-400 to-red-500'
                              }`}
                              style={{
                                width: `${(cycle.voteResult.agreeCount / cycle.voteResult.totalVoters) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                        {index === 0 && cycle.status === 'ACTIVE' && (
                          <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                            当前生效
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
