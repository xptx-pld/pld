import { useState, useEffect } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuthStore } from '../stores/authStore'
import {
  negotiationService,
  ParetoFrontierResponse,
  OptimalSolutionsResponse,
  VoteDetail,
  VoteListResponse,
} from '../services/negotiation'

export default function NegotiationPage() {
  const { roomId } = useAuthStore()
  const [tab, setTab] = useState<'pareto' | 'solutions' | 'vote' | 'commit'>('pareto')
  const [frontier, setFrontier] = useState<ParetoFrontierResponse | null>(null)
  const [solutions, setSolutions] = useState<OptimalSolutionsResponse | null>(null)
  const [votes, setVotes] = useState<VoteListResponse | null>(null)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [agreedUsers, setAgreedUsers] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [commitResult, setCommitResult] = useState('')

  // 创建投票表单
  const [showCreateVote, setShowCreateVote] = useState(false)
  const [voteForm, setVoteForm] = useState({
    title: '',
    description: '',
    options: ['', ''],
  })

  useEffect(() => {
    if (tab === 'vote' && !votes && roomId) {
      fetchVotes()
    }
  }, [tab])

  const fetchFrontier = async () => {
    if (!roomId) return
    setLoading(true)
    setError('')
    try {
      const data = await negotiationService.getParetoFrontier(roomId)
      setFrontier(data)
    } catch {
      setError('获取帕累托前沿失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchSolutions = async () => {
    if (!roomId) return
    setLoading(true)
    setError('')
    try {
      const data = await negotiationService.getOptimalSolutions(roomId)
      setSolutions(data)
    } catch {
      setError('获取最优解失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchVotes = async () => {
    if (!roomId) return
    setLoading(true)
    setError('')
    try {
      const data = await negotiationService.getVotes(roomId)
      setVotes(data)
    } catch {
      setError('获取投票列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCommit = async () => {
    if (!roomId || !selectedPlan) return
    setLoading(true)
    setError('')
    setCommitResult('')
    try {
      const data = await negotiationService.commitPlan({
        room_id: roomId,
        chosen_plan_id: selectedPlan,
        agreed_user_ids: agreedUsers.split(',').map((s) => s.trim()).filter(Boolean),
      })
      setCommitResult(data.message)
    } catch {
      setError('提交方案失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVote = async () => {
    if (!roomId || !voteForm.title) return
    setLoading(true)
    setError('')
    try {
      await negotiationService.createVote({
        room_id: roomId,
        title: voteForm.title,
        description: voteForm.description,
        options: voteForm.options.filter(Boolean),
        vote_type: 'PLAN',
      })
      setShowCreateVote(false)
      setVoteForm({ title: '', description: '', options: ['', ''] })
      fetchVotes()
    } catch {
      setError('创建投票失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCastVote = async (voteId: string, optionIndex: number) => {
    setLoading(true)
    setError('')
    try {
      await negotiationService.castVote({
        vote_id: voteId,
        option_index: optionIndex,
      })
      fetchVotes()
    } catch {
      setError('投票失败')
    } finally {
      setLoading(false)
    }
  }

  const addOption = () => {
    setVoteForm({ ...voteForm, options: [...voteForm.options, ''] })
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...voteForm.options]
    newOptions[index] = value
    setVoteForm({ ...voteForm, options: newOptions })
  }

  const removeOption = (index: number) => {
    if (voteForm.options.length <= 2) return
    const newOptions = voteForm.options.filter((_, i) => i !== index)
    setVoteForm({ ...voteForm, options: newOptions })
  }

  const chartData = frontier?.points.map((p) => ({
    x: p.satisfactionVector[0],
    y: p.satisfactionVector[1],
    planId: p.planId,
    ...p.details,
  }))

  const tabs = [
    { key: 'pareto' as const, label: '帕累托前沿', icon: '📈' },
    { key: 'solutions' as const, label: '最优解', icon: '🎯' },
    { key: 'vote' as const, label: '投票表决', icon: '🗳️' },
    { key: 'commit' as const, label: '提交方案', icon: '✅' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'PASSED': return 'bg-blue-100 text-blue-700'
      case 'REJECTED': return 'bg-red-100 text-red-700'
      case 'EXPIRED': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '进行中'
      case 'PASSED': return '已通过'
      case 'REJECTED': return '未通过'
      case 'EXPIRED': return '已过期'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">博弈协商</h2>
        <p className="text-sm text-gray-500 mt-1">通过博弈论找到最优的寝室公约方案</p>
      </div>

      {/* 标签 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex gap-1">
        {tabs.map((t) => (
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

      {!roomId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          请先在首页设置寝室ID
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      {/* 帕累托前沿 */}
      {tab === 'pareto' && (
        <div className="space-y-4">
          <button
            onClick={fetchFrontier}
            disabled={loading || !roomId}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 px-5 rounded-xl transition text-sm"
          >
            {loading ? '加载中...' : '📈 加载数据'}
          </button>

          {frontier && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-bold text-gray-700 mb-4">
                满意度权衡曲线
                <span className="text-sm font-normal text-gray-500 ml-2">({frontier.dimensions.join(' vs ')})</span>
              </h4>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    name={frontier.dimensions[0]}
                    label={{ value: frontier.dimensions[0], position: 'bottom', offset: 0 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    name={frontier.dimensions[1]}
                    label={{ value: frontier.dimensions[1], angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [value.toFixed(1), name]}
                    labelFormatter={() => ''}
                    content={({ payload }) => {
                      if (!payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-white shadow-lg rounded-lg p-3 text-xs border border-gray-100">
                          <p className="font-bold text-gray-800">{d.planId}</p>
                          <p className="text-gray-600">满意度: ({d.x}, {d.y})</p>
                          {d.acTemp && <p className="text-gray-600">空调: {d.acTemp}°C</p>}
                          {d.lightsOffTime && <p className="text-gray-600">关灯: {d.lightsOffTime}</p>}
                        </div>
                      )
                    }}
                  />
                  <Scatter data={chartData} fill="#3b82f6" line={{ stroke: '#93c5fd', strokeWidth: 2 }} />
                </ScatterChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {frontier.points.map((p) => (
                  <div key={p.planId} className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                    <span className="font-bold text-gray-800">{p.planId}</span>: ({p.satisfactionVector.join(', ')})
                    {p.details.acTemp && <span className="text-gray-500"> · 空调{p.details.acTemp}°C</span>}
                    {p.details.lightsOffTime && <span className="text-gray-500"> · 关灯{p.details.lightsOffTime}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 最优解 */}
      {tab === 'solutions' && (
        <div className="space-y-4">
          <button
            onClick={fetchSolutions}
            disabled={loading || !roomId}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 px-5 rounded-xl transition text-sm"
          >
            {loading ? '加载中...' : '🎯 加载数据'}
          </button>

          {solutions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nash */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <h4 className="font-bold text-white">纳什博弈解</h4>
                  <p className="text-xs text-blue-100 mt-1">{solutions.nashSolution.mathematicalBasis}</p>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 mb-4">{solutions.nashSolution.description}</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(solutions.nashSolution.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-gray-500">{k}</span>
                        <span className="font-medium text-gray-800">{v}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setSelectedPlan(solutions.nashSolution.planId); setTab('commit') }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2.5 rounded-lg transition"
                  >
                    选择此方案
                  </button>
                </div>
              </div>

              {/* KS */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
                  <h4 className="font-bold text-white">卡莱-斯莫罗丁斯基解</h4>
                  <p className="text-xs text-green-100 mt-1">{solutions.kalaiSmarodinskySolution.mathematicalBasis}</p>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 mb-4">{solutions.kalaiSmarodinskySolution.description}</p>
                  <div className="space-y-2 mb-4">
                    {Object.entries(solutions.kalaiSmarodinskySolution.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-gray-500">{k}</span>
                        <span className="font-medium text-gray-800">{v}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setSelectedPlan(solutions.kalaiSmarodinskySolution.planId); setTab('commit') }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2.5 rounded-lg transition"
                  >
                    选择此方案
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 投票表决 */}
      {tab === 'vote' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <button
              onClick={fetchVotes}
              disabled={loading || !roomId}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 px-5 rounded-xl transition text-sm"
            >
              {loading ? '加载中...' : '🗳️ 刷新投票'}
            </button>
            <button
              onClick={() => setShowCreateVote(!showCreateVote)}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-5 rounded-xl transition text-sm"
            >
              + 发起投票
            </button>
          </div>

          {/* 创建投票表单 */}
          {showCreateVote && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-bold text-gray-800 mb-4">发起新投票</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">投票标题</label>
                  <input
                    type="text"
                    value={voteForm.title}
                    onChange={(e) => setVoteForm({ ...voteForm, title: e.target.value })}
                    placeholder="例如: 本周空调温度方案投票"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述（可选）</label>
                  <textarea
                    value={voteForm.description}
                    onChange={(e) => setVoteForm({ ...voteForm, description: e.target.value })}
                    rows={2}
                    placeholder="投票说明..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">投票选项</label>
                  {voteForm.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`选项 ${i + 1}`}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      {voteForm.options.length > 2 && (
                        <button
                          onClick={() => removeOption(i)}
                          className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addOption}
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    + 添加选项
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateVote}
                    disabled={loading || !voteForm.title}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 px-5 rounded-lg transition text-sm"
                  >
                    {loading ? '创建中...' : '创建投票'}
                  </button>
                  <button
                    onClick={() => setShowCreateVote(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-5 rounded-lg transition text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 投票列表 */}
          {votes && (
            <div className="space-y-4">
              {votes.votes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  暂无投票，点击上方按钮发起新投票
                </div>
              ) : (
                votes.votes.map((vote) => (
                  <div key={vote.voteId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800">{vote.title}</h4>
                          {vote.description && (
                            <p className="text-sm text-gray-500 mt-1">{vote.description}</p>
                          )}
                        </div>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(vote.status)}`}>
                          {getStatusLabel(vote.status)}
                        </span>
                      </div>

                      {/* 投票进度 */}
                      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                        <span>投票类型: {vote.voteType === 'PLAN' ? '方案' : vote.voteType === 'REVISION' ? '修订' : '一般'}</span>
                        <span>已投: {vote.totalVoted}/{vote.totalVoters}</span>
                        <span>截止: {new Date(vote.expiresAt).toLocaleString('zh-CN')}</span>
                      </div>

                      {/* 选项 */}
                      <div className="space-y-3">
                        {vote.options.map((opt) => {
                          const percentage = vote.totalVoted > 0 ? (opt.vote_count / vote.totalVoted) * 100 : 0
                          const canVote = vote.status === 'ACTIVE'
                          return (
                            <div key={opt.index} className="relative">
                              <button
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
                                    {opt.voter_ids.length > 0 ? `${opt.voter_ids.join(', ')} 已投` : ''}
                                  </span>
                                  <span className="text-xs text-gray-500">{percentage.toFixed(0)}%</span>
                                </div>
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      {/* 投票结果 */}
                      {vote.result && (
                        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-700">📊 {vote.result}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}
        </div>
      )}

      {/* 提交方案 */}
      {tab === 'commit' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-lg">
          <h4 className="font-bold text-gray-800 mb-4">提交协商方案</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">方案ID</label>
              <input
                type="text"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                placeholder="例如 P_NASH_05"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">同意用户ID（逗号分隔）</label>
              <input
                type="text"
                value={agreedUsers}
                onChange={(e) => setAgreedUsers(e.target.value)}
                placeholder="U_123, U_456"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={handleCommit}
              disabled={loading || !selectedPlan}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-2.5 rounded-lg transition"
            >
              {loading ? '提交中...' : '提交方案'}
            </button>
            {commitResult && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm">
                ✓ {commitResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
