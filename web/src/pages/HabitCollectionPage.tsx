import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const SLEEP_OPTIONS = ['22:00前', '22:00-23:00', '23:00-00:00', '00:00后']
const WAKE_OPTIONS = ['6:00前', '6:00-7:00', '7:00-8:00', '8:00后']
const CLEANLINESS_OPTIONS = ['每天打扫', '每周2-3次', '每周1次', '看心情']
const TEMP_OPTIONS = ['怕冷', '适中', '怕热']
const NOISE_OPTIONS = ['非常敏感', '比较敏感', '一般', '不太敏感']
const PERSONALITY_OPTIONS = ['内向', '外向', '看情况']
const LIGHT_OPTIONS = ['喜欢明亮', '喜欢昏暗', '自然光']
const SOCIAL_OPTIONS = ['很少', '偶尔', '经常']
const STUDY_OPTIONS = ['寝室', '图书馆', '自习室', '都可以']

interface HabitData {
  sleepTime: string
  wakeTime: string
  napHabit: boolean
  stayUpLate: boolean
  cleanliness: string
  cleanLevel: number
  tempPreference: string
  windowVentilation: boolean
  lightPreference: string
  noiseSensitivity: string
  useHeadphones: boolean
  gameVideoSound: boolean
  personality: string
  bringFriends: string
  smoking: boolean
  snoring: boolean
  studyLocation: string
  specialSchedule: string
  quietStudy: boolean
}

const initialData: HabitData = {
  sleepTime: '',
  wakeTime: '',
  napHabit: false,
  stayUpLate: false,
  cleanliness: '',
  cleanLevel: 3,
  tempPreference: '',
  windowVentilation: false,
  lightPreference: '',
  noiseSensitivity: '',
  useHeadphones: false,
  gameVideoSound: false,
  personality: '',
  bringFriends: '',
  smoking: false,
  snoring: false,
  studyLocation: '',
  specialSchedule: '',
  quietStudy: false,
}

export default function HabitCollectionPage() {
  const navigate = useNavigate()
  const { completeHabitCollection } = useAuthStore()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<HabitData>(initialData)

  const updateData = (key: keyof HabitData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    // TODO: 保存到后端
    console.log('习惯数据:', data)
    completeHabitCollection()
    navigate('/dashboard')
  }

  const OptionButtons = ({
    options,
    selected,
    onSelect,
  }: {
    options: string[]
    selected: string
    onSelect: (value: string) => void
  }) => (
    <div className="flex flex-wrap gap-2 mb-4">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={`px-4 py-2 rounded-full border transition ${
            selected === option
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )

  const YesNo = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: boolean
    onChange: (v: boolean) => void
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100">
      <span className="text-gray-700">{label}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(true)}
          className={`px-4 py-1 rounded-full transition ${
            value ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          是
        </button>
        <button
          onClick={() => onChange(false)}
          className={`px-4 py-1 rounded-full transition ${
            !value ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          否
        </button>
      </div>
    </div>
  )

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">作息习惯</h2>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">通常几点睡觉？</label>
              <OptionButtons options={SLEEP_OPTIONS} selected={data.sleepTime} onSelect={(v) => updateData('sleepTime', v)} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">通常几点起床？</label>
              <OptionButtons options={WAKE_OPTIONS} selected={data.wakeTime} onSelect={(v) => updateData('wakeTime', v)} />
            </div>
            <YesNo label="有午休习惯吗？" value={data.napHabit} onChange={(v) => updateData('napHabit', v)} />
            <YesNo label="经常熬夜吗？" value={data.stayUpLate} onChange={(v) => updateData('stayUpLate', v)} />
          </div>
        )

      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">卫生习惯</h2>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">打扫频率</label>
              <OptionButtons options={CLEANLINESS_OPTIONS} selected={data.cleanliness} onSelect={(v) => updateData('cleanliness', v)} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">对整洁度要求（1-5）</label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => updateData('cleanLevel', level)}
                    className={`w-12 h-12 rounded-full border-2 transition ${
                      data.cleanLevel === level
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">1=随意 3=一般 5=非常整洁</p>
            </div>
          </div>
        )

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">环境偏好</h2>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">温度偏好</label>
              <OptionButtons options={TEMP_OPTIONS} selected={data.tempPreference} onSelect={(v) => updateData('tempPreference', v)} />
            </div>
            <YesNo label="喜欢开窗通风吗？" value={data.windowVentilation} onChange={(v) => updateData('windowVentilation', v)} />
            <div className="mb-4 mt-4">
              <label className="block text-gray-600 mb-2">照明偏好</label>
              <OptionButtons options={LIGHT_OPTIONS} selected={data.lightPreference} onSelect={(v) => updateData('lightPreference', v)} />
            </div>
          </div>
        )

      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">噪音相关</h2>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">噪音敏感度</label>
              <OptionButtons options={NOISE_OPTIONS} selected={data.noiseSensitivity} onSelect={(v) => updateData('noiseSensitivity', v)} />
            </div>
            <YesNo label="经常戴耳机吗？" value={data.useHeadphones} onChange={(v) => updateData('useHeadphones', v)} />
            <YesNo label="游戏/视频外放吗？" value={data.gameVideoSound} onChange={(v) => updateData('gameVideoSound', v)} />
          </div>
        )

      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">社交与生活</h2>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">性格</label>
              <OptionButtons options={PERSONALITY_OPTIONS} selected={data.personality} onSelect={(v) => updateData('personality', v)} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">带朋友回寝室频率</label>
              <OptionButtons options={SOCIAL_OPTIONS} selected={data.bringFriends} onSelect={(v) => updateData('bringFriends', v)} />
            </div>
            <YesNo label="是否抽烟？" value={data.smoking} onChange={(v) => updateData('smoking', v)} />
            <YesNo label="是否打呼噜？" value={data.snoring} onChange={(v) => updateData('snoring', v)} />
            <div className="mb-4 mt-4">
              <label className="block text-gray-600 mb-2">学习地点偏好</label>
              <OptionButtons options={STUDY_OPTIONS} selected={data.studyLocation} onSelect={(v) => updateData('studyLocation', v)} />
            </div>
          </div>
        )

      case 5:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">特殊需求</h2>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">其他作息说明（可选）</label>
              <textarea
                value={data.specialSchedule}
                onChange={(e) => updateData('specialSchedule', e.target.value)}
                placeholder="如：需要早起晨跑、深夜学习等"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 h-24 resize-none"
              />
            </div>
            <YesNo label="需要安静环境备考吗？" value={data.quietStudy} onChange={(v) => updateData('quietStudy', v)} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-center text-gray-800">个人习惯收集</h1>
          <p className="text-center text-gray-600 mt-1">帮助我们匹配最适合你的室友</p>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / 6) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">{step + 1} / 6</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          {renderStep()}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg transition"
            >
              上一步
            </button>
          )}
          <button
            onClick={() => {
              if (step < 5) {
                setStep(step + 1)
              } else {
                handleSubmit()
              }
            }}
            className={`flex-1 font-bold py-3 px-4 rounded-lg transition ${
              step === 5
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {step === 5 ? '完成' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  )
}
