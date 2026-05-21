interface ConflictGaugeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  probability: number
}

const levelConfig = {
  LOW: { label: '低风险', color: 'bg-green-500', text: 'text-green-600' },
  MEDIUM: { label: '中风险', color: 'bg-yellow-500', text: 'text-yellow-600' },
  HIGH: { label: '高风险', color: 'bg-red-500', text: 'text-red-600' },
}

export default function ConflictGauge({ level, probability }: ConflictGaugeProps) {
  const config = levelConfig[level]
  const percent = Math.round(probability * 100)

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">冲突风险等级</span>
        <span className={`text-sm font-bold ${config.text}`}>{config.label}</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${config.color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400 mt-1">{percent}%</p>
    </div>
  )
}
