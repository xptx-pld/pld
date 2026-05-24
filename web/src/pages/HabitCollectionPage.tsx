import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

// 作息
const SLEEP_OPTIONS = ['22:00前', '22:00-23:00', '23:00-00:00', '00:00后']
const WAKE_OPTIONS = ['6:00前', '6:00-7:00', '7:00-8:00', '8:00后']
const WEEKEND_DIFF_OPTIONS = ['差不多', '晚1-2小时', '晚3小时以上', '不规律']
const ALARM_OPTIONS = ['不需要', '响1-2次', '响3-5次', '响很多次才醒']

// 卫生
const CLEANLINESS_OPTIONS = ['每天打扫', '每周2-3次', '每周1次', '看心情']
const SHOWER_FREQ_OPTIONS = ['每天', '隔天', '2-3天一次', '不固定']
const CLOTHES_WASH_OPTIONS = ['每天换洗', '2-3天一洗', '一周一洗', '不固定']
const TRASH_DUTY_OPTIONS = ['愿意轮值', '可以接受', '不太愿意', '不想参与']

// 饮食
const MEAL_REGULARITY_OPTIONS = ['三餐规律', '不太规律', '经常不吃', '随时吃零食代替']
const STRONG_FOOD_OPTIONS = ['完全不介意', '偶尔可以', '最好别在寝室吃', '非常介意']
const DELIVERY_FREQ_OPTIONS = ['几乎不点', '偶尔点', '经常点', '天天点']

// 环境
const TEMP_OPTIONS = ['怕冷', '适中', '怕热']
const LIGHT_OPTIONS = ['喜欢明亮', '喜欢昏暗', '自然光']
const AC_OPTIONS = ['定时关', '通宵开', '尽量不开', '无所谓']
const NIGHT_LIGHT_OPTIONS = ['不需要', '偶尔需要', '必须开小夜灯']

// 噪音与通讯
const NOISE_OPTIONS = ['非常敏感', '比较敏感', '一般', '不太敏感']
const VIDEO_CALL_TOLERANCE_OPTIONS = ['完全OK', '控制时长就好', '最好去走廊', '很介意']
const VIDEO_CALL_FREQ_OPTIONS = ['几乎没有', '偶尔', '经常', '每天']

// 社交
const PERSONALITY_OPTIONS = ['内向', '外向', '看情况']
const SOCIAL_OPTIONS = ['很少', '偶尔', '经常']
const PARTNER_CALL_FREQ_OPTIONS = ['没有对象', '偶尔', '经常', '每天']

// 学习
const STUDY_OPTIONS = ['寝室', '图书馆', '自习室', '都可以']
const EXAM_BEHAVIOR_OPTIONS = ['保持安静', '正常说话', '和室友讨论', '不受影响']
const ROOM_TIME_OPTIONS = ['大部分时间在', '一半一半', '很少在寝室', '看课表']

// 共享
const SHARING_OPTIONS = ['很乐意分享', '偶尔可以', '看情况', '不太喜欢']
const BORROW_OPTIONS = ['随便用', '提前说一声就好', '不太喜欢', '不希望借用']
const EAT_NEAR_DESK_OPTIONS = ['无所谓', '最好别', '完全不能接受']
const PUBLIC_SPACE_OPTIONS = ['各自划分', '共享为主', '无所谓']

// 沟通
const CONFLICT_OPTIONS = ['当面直说', '微信聊', '找辅导员调解', '先冷静再说']
const DUTY_SYSTEM_OPTIONS = ['非常支持', '可以接受', '无所谓', '不太想参与']

interface HabitData {
  // 作息
  sleepTime: string
  wakeTime: string
  expectedSleepTime: string
  expectedWakeTime: string
  weekendDiff: string
  alarmHabit: string
  napHabit: boolean
  stayUpLate: boolean
  // 卫生
  cleanliness: string
  cleanLevel: number
  showerFreq: string
  clothesWash: string
  trashDuty: string
  // 饮食
  mealRegularity: string
  strongFood: string
  deliveryFreq: string
  // 环境
  tempPreference: string
  windowVentilation: boolean
  lightPreference: string
  acHabit: string
  nightLight: string
  // 噪音与通讯
  noiseSensitivity: string
  useHeadphones: boolean
  gameVideoSound: boolean
  videoCallTolerance: string
  videoCallFreq: string
  // 社交
  personality: string
  bringFriends: string
  smoking: boolean
  snoring: boolean
  hasPartner: boolean
  partnerCallFreq: string
  // 学习
  studyLocation: string
  quietStudy: boolean
  examBehavior: string
  remoteWork: boolean
  roomTime: string
  // 共享
  itemSharing: string
  borrowTolerance: string
  eatNearDesk: string
  publicSpace: string
  // 沟通
  conflictResolution: string
  covenantWillingness: boolean
  dutySystem: string
  // 特殊
  specialSchedule: string
}

const initialData: HabitData = {
  // 作息
  sleepTime: '',
  wakeTime: '',
  expectedSleepTime: '',
  expectedWakeTime: '',
  weekendDiff: '',
  alarmHabit: '',
  napHabit: false,
  stayUpLate: false,
  // 卫生
  cleanliness: '',
  cleanLevel: 3,
  showerFreq: '',
  clothesWash: '',
  trashDuty: '',
  // 饮食
  mealRegularity: '',
  strongFood: '',
  deliveryFreq: '',
  // 环境
  tempPreference: '',
  windowVentilation: false,
  lightPreference: '',
  acHabit: '',
  nightLight: '',
  // 噪音与通讯
  noiseSensitivity: '',
  useHeadphones: false,
  gameVideoSound: false,
  videoCallTolerance: '',
  videoCallFreq: '',
  // 社交
  personality: '',
  bringFriends: '',
  smoking: false,
  snoring: false,
  hasPartner: false,
  partnerCallFreq: '',
  // 学习
  studyLocation: '',
  quietStudy: false,
  examBehavior: '',
  remoteWork: false,
  roomTime: '',
  // 共享
  itemSharing: '',
  borrowTolerance: '',
  eatNearDesk: '',
  publicSpace: '',
  // 沟通
  conflictResolution: '',
  covenantWillingness: false,
  dutySystem: '',
  // 特殊
  specialSchedule: '',
}

const TOTAL_STEPS = 10

export default function HabitCollectionPage() {
  const navigate = useNavigate()
  const { completeHabitCollection } = useAuthStore()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<HabitData>(initialData)

  const updateData = (key: keyof HabitData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
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

  const ScaleSelect = ({
    label,
    value,
    onChange,
    min = 1,
    max = 5,
    minLabel,
    maxLabel,
  }: {
    label: string
    value: number
    onChange: (v: number) => void
    min?: number
    max?: number
    minLabel?: string
    maxLabel?: string
  }) => (
    <div className="mb-4">
      <label className="block text-gray-600 mb-2">{label}</label>
      <div className="flex gap-3">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`w-12 h-12 rounded-full border-2 transition ${
              value === level
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <p className="text-sm text-gray-500 mt-2">
          {minLabel}{'　　　　　　'}{maxLabel}
        </p>
      )}
    </div>
  )

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">作息习惯</h2>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">通常几点睡觉？（真实）</label>
              <OptionButtons options={SLEEP_OPTIONS} selected={data.sleepTime} onSelect={(v) => updateData('sleepTime', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">希望几点睡觉？（期望）</label>
              <OptionButtons options={SLEEP_OPTIONS} selected={data.expectedSleepTime} onSelect={(v) => updateData('expectedSleepTime', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">通常几点起床？（真实）</label>
              <OptionButtons options={WAKE_OPTIONS} selected={data.wakeTime} onSelect={(v) => updateData('wakeTime', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">希望几点起床？（期望）</label>
              <OptionButtons options={WAKE_OPTIONS} selected={data.expectedWakeTime} onSelect={(v) => updateData('expectedWakeTime', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">周末作息和平日差异</label>
              <OptionButtons options={WEEKEND_DIFF_OPTIONS} selected={data.weekendDiff} onSelect={(v) => updateData('weekendDiff', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">闹钟习惯</label>
              <OptionButtons options={ALARM_OPTIONS} selected={data.alarmHabit} onSelect={(v) => updateData('alarmHabit', v)} />
            </div>
            <YesNo label="有午休习惯吗？" value={data.napHabit} onChange={(v) => updateData('napHabit', v)} />
            <YesNo label="经常熬夜吗？" value={data.stayUpLate} onChange={(v) => updateData('stayUpLate', v)} />
          </div>
        )

      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">卫生习惯</h2>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">打扫频率</label>
              <OptionButtons options={CLEANLINESS_OPTIONS} selected={data.cleanliness} onSelect={(v) => updateData('cleanliness', v)} />
            </div>
            <ScaleSelect
              label="对整洁度要求（1-5）"
              value={data.cleanLevel}
              onChange={(v) => updateData('cleanLevel', v)}
              minLabel="随意"
              maxLabel="非常整洁"
            />
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">洗澡频率</label>
              <OptionButtons options={SHOWER_FREQ_OPTIONS} selected={data.showerFreq} onSelect={(v) => updateData('showerFreq', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">衣物换洗频率</label>
              <OptionButtons options={CLOTHES_WASH_OPTIONS} selected={data.clothesWash} onSelect={(v) => updateData('clothesWash', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">倒垃圾轮值意愿</label>
              <OptionButtons options={TRASH_DUTY_OPTIONS} selected={data.trashDuty} onSelect={(v) => updateData('trashDuty', v)} />
            </div>
          </div>
        )

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">饮食习惯</h2>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">三餐规律程度</label>
              <OptionButtons options={MEAL_REGULARITY_OPTIONS} selected={data.mealRegularity} onSelect={(v) => updateData('mealRegularity', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">在寝室吃味道重的食物（螺蛳粉、泡面等）</label>
              <OptionButtons options={STRONG_FOOD_OPTIONS} selected={data.strongFood} onSelect={(v) => updateData('strongFood', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">点外卖频率</label>
              <OptionButtons options={DELIVERY_FREQ_OPTIONS} selected={data.deliveryFreq} onSelect={(v) => updateData('deliveryFreq', v)} />
            </div>
          </div>
        )

      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">环境偏好</h2>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">温度偏好</label>
              <OptionButtons options={TEMP_OPTIONS} selected={data.tempPreference} onSelect={(v) => updateData('tempPreference', v)} />
            </div>
            <YesNo label="喜欢开窗通风吗？" value={data.windowVentilation} onChange={(v) => updateData('windowVentilation', v)} />
            <div className="mb-6 mt-6">
              <label className="block text-gray-600 mb-2">照明偏好</label>
              <OptionButtons options={LIGHT_OPTIONS} selected={data.lightPreference} onSelect={(v) => updateData('lightPreference', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">开空调习惯</label>
              <OptionButtons options={AC_OPTIONS} selected={data.acHabit} onSelect={(v) => updateData('acHabit', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">小夜灯需求</label>
              <OptionButtons options={NIGHT_LIGHT_OPTIONS} selected={data.nightLight} onSelect={(v) => updateData('nightLight', v)} />
            </div>
          </div>
        )

      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">噪音与通讯</h2>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">噪音敏感度</label>
              <OptionButtons options={NOISE_OPTIONS} selected={data.noiseSensitivity} onSelect={(v) => updateData('noiseSensitivity', v)} />
            </div>
            <YesNo label="经常戴耳机吗？" value={data.useHeadphones} onChange={(v) => updateData('useHeadphones', v)} />
            <YesNo label="游戏/视频外放吗？" value={data.gameVideoSound} onChange={(v) => updateData('gameVideoSound', v)} />
            <div className="mb-6 mt-6">
              <label className="block text-gray-600 mb-2">对室友在寝室打视频电话的接受度</label>
              <OptionButtons options={VIDEO_CALL_TOLERANCE_OPTIONS} selected={data.videoCallTolerance} onSelect={(v) => updateData('videoCallTolerance', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">自己打视频电话/语音的频率</label>
              <OptionButtons options={VIDEO_CALL_FREQ_OPTIONS} selected={data.videoCallFreq} onSelect={(v) => updateData('videoCallFreq', v)} />
            </div>
          </div>
        )

      case 5:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">社交与生活</h2>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">性格</label>
              <OptionButtons options={PERSONALITY_OPTIONS} selected={data.personality} onSelect={(v) => updateData('personality', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">带朋友回寝室频率</label>
              <OptionButtons options={SOCIAL_OPTIONS} selected={data.bringFriends} onSelect={(v) => updateData('bringFriends', v)} />
            </div>
            <YesNo label="是否抽烟？" value={data.smoking} onChange={(v) => updateData('smoking', v)} />
            <YesNo label="是否打呼噜？" value={data.snoring} onChange={(v) => updateData('snoring', v)} />
            <YesNo label="是否有对象？" value={data.hasPartner} onChange={(v) => updateData('hasPartner', v)} />
            {data.hasPartner && (
              <div className="mb-6 mt-6">
                <label className="block text-gray-600 mb-2">和对象视频通话频率</label>
                <OptionButtons options={PARTNER_CALL_FREQ_OPTIONS} selected={data.partnerCallFreq} onSelect={(v) => updateData('partnerCallFreq', v)} />
              </div>
            )}
          </div>
        )

      case 6:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">学习与时间管理</h2>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">学习地点偏好</label>
              <OptionButtons options={STUDY_OPTIONS} selected={data.studyLocation} onSelect={(v) => updateData('studyLocation', v)} />
            </div>
            <YesNo label="需要安静环境备考吗？" value={data.quietStudy} onChange={(v) => updateData('quietStudy', v)} />
            <div className="mb-6 mt-6">
              <label className="block text-gray-600 mb-2">期末/考试周行为模式</label>
              <OptionButtons options={EXAM_BEHAVIOR_OPTIONS} selected={data.examBehavior} onSelect={(v) => updateData('examBehavior', v)} />
            </div>
            <YesNo label="是否有网课/远程实习等占用寝室时间？" value={data.remoteWork} onChange={(v) => updateData('remoteWork', v)} />
            <div className="mb-6 mt-6">
              <label className="block text-gray-600 mb-2">课余在寝室的时间占比</label>
              <OptionButtons options={ROOM_TIME_OPTIONS} selected={data.roomTime} onSelect={(v) => updateData('roomTime', v)} />
            </div>
          </div>
        )

      case 7:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">共享与边界</h2>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">物品共享意愿（零食、日用品等）</label>
              <OptionButtons options={SHARING_OPTIONS} selected={data.itemSharing} onSelect={(v) => updateData('itemSharing', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">对室友借用你物品的接受度</label>
              <OptionButtons options={BORROW_OPTIONS} selected={data.borrowTolerance} onSelect={(v) => updateData('borrowTolerance', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">在你位置附近吃东西</label>
              <OptionButtons options={EAT_NEAR_DESK_OPTIONS} selected={data.eatNearDesk} onSelect={(v) => updateData('eatNearDesk', v)} />
            </div>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">寝室公共空间使用偏好</label>
              <OptionButtons options={PUBLIC_SPACE_OPTIONS} selected={data.publicSpace} onSelect={(v) => updateData('publicSpace', v)} />
            </div>
          </div>
        )

      case 8:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">沟通偏好</h2>
            <div className="mb-6">
              <label className="block text-gray-600 mb-2">有矛盾时偏好怎么解决</label>
              <OptionButtons options={CONFLICT_OPTIONS} selected={data.conflictResolution} onSelect={(v) => updateData('conflictResolution', v)} />
            </div>
            <YesNo label="愿意参与制定寝室公约吗？" value={data.covenantWillingness} onChange={(v) => updateData('covenantWillingness', v)} />
            <div className="mb-6 mt-6">
              <label className="block text-gray-600 mb-2">对轮值制度（打扫、倒垃圾）的态度</label>
              <OptionButtons options={DUTY_SYSTEM_OPTIONS} selected={data.dutySystem} onSelect={(v) => updateData('dutySystem', v)} />
            </div>
          </div>
        )

      case 9:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">特殊需求</h2>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">其他作息/生活说明（可选）</label>
              <textarea
                value={data.specialSchedule}
                onChange={(e) => updateData('specialSchedule', e.target.value)}
                placeholder="如：需要早起晨跑、深夜学习、对某种气味过敏、需要固定时间健身等"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 h-32 resize-none"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const stepTitles = [
    '作息习惯',
    '卫生习惯',
    '饮食习惯',
    '环境偏好',
    '噪音与通讯',
    '社交与生活',
    '学习与时间管理',
    '共享与边界',
    '沟通偏好',
    '特殊需求',
  ]

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
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {stepTitles[step]}（{step + 1} / {TOTAL_STEPS}）
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
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
              if (step < TOTAL_STEPS - 1) {
                setStep(step + 1)
              } else {
                handleSubmit()
              }
            }}
            className={`flex-1 font-bold py-3 px-4 rounded-lg transition ${
              step === TOTAL_STEPS - 1
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {step === TOTAL_STEPS - 1 ? '完成' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  )
}
