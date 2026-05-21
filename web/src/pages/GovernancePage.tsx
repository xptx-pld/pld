import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { governanceService, ViolationResponse, InitiateRevisionResponse, NVCResponse } from '../services/governance'

const conflictTypes = [
  { value: 'LIGHT_AND_NOISE', label: '灯光与噪音' },
  { value: 'AC_TEMPERATURE', label: '空调温度' },
  { value: 'SCHEDULE_MISMATCH', label: '作息不一致' },
  { value: 'GENERAL', label: '综合' },
]

export default function GovernancePage() {
  const { roomId } = useAuthStore()
  const [openSection, setOpenSection] = useState<string | null>('violation')

  // 违约表单
  const [violationForm, setViolationForm] = useState({
    violatorId: '',
    ruleType: 'LIGHTS_OFF',
    evidenceLog: '',
  })
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggle = (key: string) => setOpenSection(openSection === key ? null : key)

  const handleViolation = async () => {
    if (!roomId) return
    setLoading(true)
    setError('')
    setViolationResult(null)
    try {
      const data = await governanceService.reportViolation({
        room_id: roomId,
        violator_id: violationForm.violatorId,
        rule_type: violationForm.ruleType,
        evidence_log: violationForm.evidenceLog,
      })
      setViolationResult(data)
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

  const Section = ({ id, title, icon, color, children }: { id: string; title: string; icon: string; color: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => toggle(id)}
        className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
            <span className="text-xl">{icon}</span>
          </div>
          <span className="font-bold text-gray-800">{title}</span>
        </div>
        <span className="text-gray-400 text-sm">{openSection === id ? '▲ 收起' : '▼ 展开'}</span>
      </button>
      {openSection === id && <div className="p-5 border-t border-gray-100">{children}</div>}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">自治治理</h2>
        <p className="text-sm text-gray-500 mt-1">管理寝室公约、处理违约、调解冲突</p>
      </div>

      {!roomId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          请先在首页设置寝室ID
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      <div className="space-y-4">
        {/* 上报违约 */}
        <Section id="violation" title="上报违约" icon="🚨" color="from-red-500 to-red-600">
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
                <div className="flex gap-4 text-xs">
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
        </Section>

        {/* 发起修订 */}
        <Section id="revision" title="发起公约修订" icon="🔄" color="from-blue-500 to-blue-600">
          <p className="text-sm text-gray-500 mb-4">发起新一轮公约迭代周期，系统将生成执行报告并开启投票。</p>
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
        </Section>

        {/* NVC调解 */}
        <Section id="nvc" title="NVC冲突调解" icon="💬" color="from-green-500 to-green-600">
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
        </Section>
      </div>
    </div>
  )
}
