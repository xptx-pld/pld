import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import {
  insightService,
  ContrastReportResponse,
  ConflictPredictionResponse,
  TrendsResponse,
  RoomComparisonResponse,
} from '../services/insights'
import ConflictGauge from '../components/ConflictGauge'

export default function InsightsPage() {
  const { user, roomId } = useAuthStore()
  const [tab, setTab] = useState<'contrast' | 'prediction' | 'trends' | 'comparison'>('contrast')
  const [contrast, setContrast] = useState<ContrastReportResponse | null>(null)
  const [prediction, setPrediction] = useState<ConflictPredictionResponse | null>(null)
  const [trends, setTrends] = useState<TrendsResponse | null>(null)
  const [comparison, setComparison] = useState<RoomComparisonResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tab === 'trends' && !trends) {
      fetchTrends()
    } else if (tab === 'comparison' && !comparison) {
      fetchComparison()
    }
  }, [tab])

  const fetchContrast = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const data = await insightService.getContrastReport(user.user_id)
      setContrast(data)
    } catch {
      setError('获取对比报告失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchPrediction = async () => {
    if (!roomId) return
    setLoading(true)
    setError('')
    try {
      const data = await insightService.getConflictPrediction(roomId)
      setPrediction(data)
    } catch {
      setError('获取冲突预警失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrends = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await insightService.getTrends()
      setTrends(data)
    } catch {
      setError('获取趋势数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchComparison = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await insightService.getRoomComparison()
      setComparison(data)
    } catch {
      setError('获取对比数据失败')
    } finally {
      setLoading(false)
    }
  }

  const maxValue = trends?.datasets.reduce((max, ds) => Math.max(max, ...ds.data), 0) || 1

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">行为洞察</h2>
        <p className="text-sm text-gray-500 mt-1">分析你的行为模式与潜在冲突</p>
      </div>

      {/* 标签切换 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex gap-1">
        {(['contrast', 'prediction', 'trends', 'comparison'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError('') }}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === t ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'contrast' && '📋 对比报告'}
            {t === 'prediction' && '⚠️ 冲突预警'}
            {t === 'trends' && '📈 趋势分析'}
            {t === 'comparison' && '👥 室友对比'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>
      )}

      {/* 对比报告 */}
      {tab === 'contrast' && (
        <div className="space-y-4">
          <button
            onClick={fetchContrast}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 px-5 rounded-xl transition text-sm"
          >
            {loading ? '加载中...' : '📊 查看报告'}
          </button>

          {contrast && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600">📝</span>
                    </div>
                    <h4 className="font-bold text-gray-700">自报偏好</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">入睡时间</span>
                      <span className="font-medium text-gray-800">{contrast.explicitProfile.sleepTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">空调温度</span>
                      <span className="font-medium text-gray-800">{contrast.explicitProfile.acTemp}°C</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600">📱</span>
                    </div>
                    <h4 className="font-bold text-gray-700">实际行为</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">入睡时间</span>
                      <span className="font-medium text-gray-800">{contrast.implicitProfile.actualAverageSleepTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">空调温度</span>
                      <span className="font-medium text-gray-800">{contrast.implicitProfile.actualAcTemp}°C</span>
                    </div>
                  </div>
                </div>
              </div>

              {contrast.conflictTags.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h4 className="font-bold text-gray-700 mb-3">冲突标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {contrast.conflictTags.map((tag) => (
                      <span key={tag} className="bg-red-50 text-red-600 text-xs font-medium px-3 py-1.5 rounded-full border border-red-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <h4 className="font-bold text-blue-700 mb-2">💡 分析结论</h4>
                <p className="text-sm text-blue-800 leading-relaxed">{contrast.conclusion}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* 冲突预警 */}
      {tab === 'prediction' && (
        <div className="space-y-4">
          <button
            onClick={fetchPrediction}
            disabled={loading || !roomId}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2.5 px-5 rounded-xl transition text-sm"
          >
            {loading ? '加载中...' : '🔮 查看预测'}
          </button>
          {!roomId && (
            <p className="text-sm text-gray-400">请先在首页设置寝室ID</p>
          )}

          {prediction && (
            <>
              <ConflictGauge level={prediction.warningLevel} probability={prediction.probability} />

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h4 className="font-bold text-gray-700 mb-3">触发因素</h4>
                <ul className="space-y-2">
                  {prediction.triggerFactors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-orange-500 mt-0.5">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-5 border border-yellow-200">
                <h4 className="font-bold text-yellow-700 mb-2">⚡ 预测提示</h4>
                <p className="text-sm text-yellow-800 leading-relaxed">{prediction.predictionMessage}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* 趋势分析 */}
      {tab === 'trends' && (
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}

          {trends && !loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-bold text-gray-700 mb-4">最近7天行为趋势</h4>

              <div className="flex items-end justify-between h-48 gap-2 px-4">
                {trends.labels.map((label, index) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-1 items-end justify-center" style={{ height: '160px' }}>
                      {trends.datasets.map((ds, dsIndex) => (
                        <div
                          key={dsIndex}
                          className="flex-1 rounded-t-md transition-all duration-500 relative group"
                          style={{
                            height: `${(ds.data[index] / maxValue) * 100}%`,
                            backgroundColor: ds.color,
                            minHeight: ds.data[index] > 0 ? '8px' : '2px',
                          }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                            <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {ds.label}: {ds.data[index]}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-6 mt-4">
                {trends.datasets.map((ds, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: ds.color }} />
                    <span className="text-sm text-gray-600">{ds.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!trends && !loading && (
            <div className="text-center py-12 text-gray-500">暂无趋势数据</div>
          )}
        </div>
      )}

      {/* 室友对比 */}
      {tab === 'comparison' && (
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}

          {comparison && !loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparison.members.map((member) => (
                  <div key={member.user_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">{member.username[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{member.username}</p>
                        <p className="text-xs text-gray-500">睡眠: {member.sleep_time || '未设置'}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {comparison.metrics.map((metric) => {
                        const value = (member as any)[metric.key] as number || 0
                        const percentage = (value / metric.max) * 100
                        return (
                          <div key={metric.key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">{metric.label}</span>
                              <span className="font-medium text-gray-700">{value}/{metric.max}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {comparison.members.length === 0 && (
                <div className="text-center py-12 text-gray-500">暂无成员数据</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
