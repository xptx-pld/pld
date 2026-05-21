import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { preferenceService } from '../services/preferences'

const noiseLabels = ['非常敏感', '较敏感', '一般', '较耐受', '完全不在意']

export default function PreferencesPage() {
  const { user, roomId } = useAuthStore()
  const [form, setForm] = useState({
    roomId: roomId || '',
    sleepTime: '23:00',
    acTemp: 26,
    noiseLevel: 3,
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setResult(null)
    try {
      await preferenceService.submitExplicitPreference({
        user_id: user.user_id,
        room_id: form.roomId,
        sleep_time: form.sleepTime,
        ac_temp_preference: form.acTemp,
        noise_tolerance_level: form.noiseLevel,
      })
      setResult({ success: true, message: '偏好保存成功！' })
    } catch {
      setResult({ success: false, message: '保存失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">偏好管理</h2>
      <p className="text-gray-500 mb-6">设置你的生活偏好，系统将据此为你协商最优公约方案。</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* 寝室ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">寝室ID</label>
          <input
            type="text"
            value={form.roomId}
            onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            placeholder="例如 R_401"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            required
          />
        </div>

        {/* 入睡时间 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">期望入睡时间</label>
          <input
            type="time"
            value={form.sleepTime}
            onChange={(e) => setForm({ ...form, sleepTime: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* 空调温度 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            期望空调温度: <span className="text-blue-600 font-bold">{form.acTemp}°C</span>
          </label>
          <input
            type="range"
            min={16}
            max={30}
            value={form.acTemp}
            onChange={(e) => setForm({ ...form, acTemp: Number(e.target.value) })}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>16°C</span>
            <span>30°C</span>
          </div>
        </div>

        {/* 噪音耐受度 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">噪音耐受度</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setForm({ ...form, noiseLevel: level })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  form.noiseLevel === level
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">{noiseLabels[form.noiseLevel - 1]}</p>
        </div>

        {/* 提交 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-2.5 rounded-lg transition"
        >
          {loading ? '保存中...' : '保存偏好'}
        </button>

        {/* 结果提示 */}
        {result && (
          <div
            className={`p-3 rounded-lg text-sm ${
              result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {result.message}
          </div>
        )}
      </form>
    </div>
  )
}
