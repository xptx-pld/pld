import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { insightService, ContrastReportResponse, ConflictPredictionResponse } from '../services/insights'
import ConflictGauge from '../components/ConflictGauge'

export default function InsightsPage() {
  const { user, roomId } = useAuthStore()
  const [tab, setTab] = useState<'contrast' | 'prediction'>('contrast')
  const [contrast, setContrast] = useState<ContrastReportResponse | null>(null)
  const [prediction, setPrediction] = useState<ConflictPredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">行为洞察</h2>
        <p className="text-sm text-gray-500 mt-1">分析你的行为模式与潜在冲突</p>
      </div>

      {/* 标签切换 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex gap-1">
        <button
          onClick={() => { setTab('contrast'); setError('') }}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            tab === 'contrast' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          📋 对比报告
        </button>
        <button
          onClick={() => { setTab('prediction'); setError('') }}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            tab === 'prediction' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          ⚠️ 冲突预警
        </button>
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
              {/* 对比卡片 */}
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

              {/* 冲突标签 */}
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

              {/* 分析结论 */}
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
    </div>
  )
}
