import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { preferenceService } from '../services/preferences'

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

// 噪音
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

interface PreferenceData {
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
  // 噪音
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

const initialData: PreferenceData = {
  sleepTime: '', wakeTime: '', expectedSleepTime: '', expectedWakeTime: '',
  weekendDiff: '', alarmHabit: '', napHabit: false, stayUpLate: false,
  cleanliness: '', cleanLevel: 3, showerFreq: '', clothesWash: '', trashDuty: '',
  mealRegularity: '', strongFood: '', deliveryFreq: '',
  tempPreference: '', windowVentilation: false, lightPreference: '', acHabit: '', nightLight: '',
  noiseSensitivity: '', useHeadphones: false, gameVideoSound: false, videoCallTolerance: '', videoCallFreq: '',
  personality: '', bringFriends: '', smoking: false, snoring: false, hasPartner: false, partnerCallFreq: '',
  studyLocation: '', quietStudy: false, examBehavior: '', remoteWork: false, roomTime: '',
  itemSharing: '', borrowTolerance: '', eatNearDesk: '', publicSpace: '',
  conflictResolution: '', covenantWillingness: false, dutySystem: '',
  specialSchedule: '',
}

const sections = [
  { key: 'schedule', label: '作息习惯', icon: '🌙' },
  { key: 'hygiene', label: '卫生习惯', icon: '🧹' },
  { key: 'food', label: '饮食习惯', icon: '🍜' },
  { key: 'environment', label: '环境偏好', icon: '🌡️' },
  { key: 'noise', label: '噪音与通讯', icon: '🔇' },
  { key: 'social', label: '社交与生活', icon: '👥' },
  { key: 'study', label: '学习与时间', icon: '📚' },
  { key: 'sharing', label: '共享与边界', icon: '🤝' },
  { key: 'communication', label: '沟通偏好', icon: '💬' },
  { key: 'special', label: '特殊需求', icon: '⭐' },
]

export default function PreferencesPage() {
  const { roomId } = useAuthStore()
  const [activeSection, setActiveSection] = useState('schedule')
  const [data, setData] = useState<PreferenceData>(initialData)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [fetchLoading, setFetchLoading] = useState(true)

  // 获取已有偏好数据
  useEffect(() => {
    const fetchPreference = async () => {
      try {
        const preference = await preferenceService.getMyPreference()
        if (preference) {
          setData(preference)
        }
      } catch (err) {
        console.error('获取偏好失败:', err)
      } finally {
        setFetchLoading(false)
      }
    }
    fetchPreference()
  }, [])

  const update = (key: keyof PreferenceData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setResult(null)
    try {
      await preferenceService.submitFullPreference({
        room_id: roomId || '',
        ...data,
      })
      setResult({ success: true, message: '偏好保存成功！' })
    } catch {
      setResult({ success: false, message: '保存失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  const OptionButtons = ({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (v: string) => void }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={`px-4 py-2 rounded-full border text-sm transition ${
            selected === opt
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )

  const YesNo = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100">
      <span className="text-gray-700 text-sm">{label}</span>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(true)} className={`px-4 py-1 rounded-full text-sm transition ${value ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>是</button>
        <button type="button" onClick={() => onChange(false)} className={`px-4 py-1 rounded-full text-sm transition ${!value ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>否</button>
      </div>
    </div>
  )

  const ScaleSelect = ({ label, value, onChange, minLabel, maxLabel }: { label: string; value: number; onChange: (v: number) => void; minLabel?: string; maxLabel?: string }) => (
    <div>
      <label className="block text-gray-600 text-sm mb-2">{label}</label>
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((level) => (
          <button key={level} type="button" onClick={() => onChange(level)} className={`w-10 h-10 rounded-full border-2 text-sm transition ${value === level ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'}`}>{level}</button>
        ))}
      </div>
      {(minLabel || maxLabel) && <p className="text-xs text-gray-400 mt-1">{minLabel}{'　　　　　　'}{maxLabel}</p>}
    </div>
  )

  const renderSection = () => {
    switch (activeSection) {
      case 'schedule':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 text-sm mb-2">通常几点睡觉（真实）</label>
              <OptionButtons options={SLEEP_OPTIONS} selected={data.sleepTime} onSelect={(v) => update('sleepTime', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">希望几点睡觉（期望）</label>
              <OptionButtons options={SLEEP_OPTIONS} selected={data.expectedSleepTime} onSelect={(v) => update('expectedSleepTime', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">通常几点起床（真实）</label>
              <OptionButtons options={WAKE_OPTIONS} selected={data.wakeTime} onSelect={(v) => update('wakeTime', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">希望几点起床（期望）</label>
              <OptionButtons options={WAKE_OPTIONS} selected={data.expectedWakeTime} onSelect={(v) => update('expectedWakeTime', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">周末作息差异</label>
              <OptionButtons options={WEEKEND_DIFF_OPTIONS} selected={data.weekendDiff} onSelect={(v) => update('weekendDiff', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">闹钟习惯</label>
              <OptionButtons options={ALARM_OPTIONS} selected={data.alarmHabit} onSelect={(v) => update('alarmHabit', v)} />
            </div>
            <YesNo label="有午休习惯" value={data.napHabit} onChange={(v) => update('napHabit', v)} />
            <YesNo label="经常熬夜" value={data.stayUpLate} onChange={(v) => update('stayUpLate', v)} />
          </div>
        )
      case 'hygiene':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 text-sm mb-2">打扫频率</label>
              <OptionButtons options={CLEANLINESS_OPTIONS} selected={data.cleanliness} onSelect={(v) => update('cleanliness', v)} />
            </div>
            <ScaleSelect label="整洁度要求" value={data.cleanLevel} onChange={(v) => update('cleanLevel', v)} minLabel="随意" maxLabel="非常整洁" />
            <div>
              <label className="block text-gray-600 text-sm mb-2">洗澡频率</label>
              <OptionButtons options={SHOWER_FREQ_OPTIONS} selected={data.showerFreq} onSelect={(v) => update('showerFreq', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">衣物换洗频率</label>
              <OptionButtons options={CLOTHES_WASH_OPTIONS} selected={data.clothesWash} onSelect={(v) => update('clothesWash', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">倒垃圾轮值意愿</label>
              <OptionButtons options={TRASH_DUTY_OPTIONS} selected={data.trashDuty} onSelect={(v) => update('trashDuty', v)} />
            </div>
          </div>
        )
      case 'food':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 text-sm mb-2">三餐规律程度</label>
              <OptionButtons options={MEAL_REGULARITY_OPTIONS} selected={data.mealRegularity} onSelect={(v) => update('mealRegularity', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">在寝室吃味道重的食物</label>
              <OptionButtons options={STRONG_FOOD_OPTIONS} selected={data.strongFood} onSelect={(v) => update('strongFood', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">点外卖频率</label>
              <OptionButtons options={DELIVERY_FREQ_OPTIONS} selected={data.deliveryFreq} onSelect={(v) => update('deliveryFreq', v)} />
            </div>
          </div>
        )
      case 'environment':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 text-sm mb-2">温度偏好</label>
              <OptionButtons options={TEMP_OPTIONS} selected={data.tempPreference} onSelect={(v) => update('tempPreference', v)} />
            </div>
            <YesNo label="喜欢开窗通风" value={data.windowVentilation} onChange={(v) => update('windowVentilation', v)} />
            <div>
              <label className="block text-gray-600 text-sm mb-2">照明偏好</label>
              <OptionButtons options={LIGHT_OPTIONS} selected={data.lightPreference} onSelect={(v) => update('lightPreference', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">开空调习惯</label>
              <OptionButtons options={AC_OPTIONS} selected={data.acHabit} onSelect={(v) => update('acHabit', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">小夜灯需求</label>
              <OptionButtons options={NIGHT_LIGHT_OPTIONS} selected={data.nightLight} onSelect={(v) => update('nightLight', v)} />
            </div>
          </div>
        )
      case 'noise':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 text-sm mb-2">噪音敏感度</label>
              <OptionButtons options={NOISE_OPTIONS} selected={data.noiseSensitivity} onSelect={(v) => update('noiseSensitivity', v)} />
            </div>
            <YesNo label="经常戴耳机" value={data.useHeadphones} onChange={(v) => update('useHeadphones', v)} />
            <YesNo label="游戏/视频外放" value={data.gameVideoSound} onChange={(v) => update('gameVideoSound', v)} />
            <div>
              <label className="block text-gray-600 text-sm mb-2">对室友打视频电话的接受度</label>
              <OptionButtons options={VIDEO_CALL_TOLERANCE_OPTIONS} selected={data.videoCallTolerance} onSelect={(v) => update('videoCallTolerance', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">自己打视频电话的频率</label>
              <OptionButtons options={VIDEO_CALL_FREQ_OPTIONS} selected={data.videoCallFreq} onSelect={(v) => update('videoCallFreq', v)} />
            </div>
          </div>
        )
      case 'social':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 text-sm mb-2">性格</label>
              <OptionButtons options={PERSONALITY_OPTIONS} selected={data.personality} onSelect={(v) => update('personality', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">带朋友回寝室频率</label>
              <OptionButtons options={SOCIAL_OPTIONS} selected={data.bringFriends} onSelect={(v) => update('bringFriends', v)} />
            </div>
            <YesNo label="是否抽烟" value={data.smoking} onChange={(v) => update('smoking', v)} />
            <YesNo label="是否打呼噜" value={data.snoring} onChange={(v) => update('snoring', v)} />
            <YesNo label="是否有对象" value={data.hasPartner} onChange={(v) => update('hasPartner', v)} />
            {data.hasPartner && (
              <div>
                <label className="block text-gray-600 text-sm mb-2">和对象视频通话频率</label>
                <OptionButtons options={PARTNER_CALL_FREQ_OPTIONS} selected={data.partnerCallFreq} onSelect={(v) => update('partnerCallFreq', v)} />
              </div>
            )}
          </div>
        )
      case 'study':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 text-sm mb-2">学习地点偏好</label>
              <OptionButtons options={STUDY_OPTIONS} selected={data.studyLocation} onSelect={(v) => update('studyLocation', v)} />
            </div>
            <YesNo label="需要安静环境备考" value={data.quietStudy} onChange={(v) => update('quietStudy', v)} />
            <div>
              <label className="block text-gray-600 text-sm mb-2">考试周行为模式</label>
              <OptionButtons options={EXAM_BEHAVIOR_OPTIONS} selected={data.examBehavior} onSelect={(v) => update('examBehavior', v)} />
            </div>
            <YesNo label="有网课/远程实习占用寝室时间" value={data.remoteWork} onChange={(v) => update('remoteWork', v)} />
            <div>
              <label className="block text-gray-600 text-sm mb-2">课余在寝室的时间占比</label>
              <OptionButtons options={ROOM_TIME_OPTIONS} selected={data.roomTime} onSelect={(v) => update('roomTime', v)} />
            </div>
          </div>
        )
      case 'sharing':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 text-sm mb-2">物品共享意愿</label>
              <OptionButtons options={SHARING_OPTIONS} selected={data.itemSharing} onSelect={(v) => update('itemSharing', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">对室友借用物品的接受度</label>
              <OptionButtons options={BORROW_OPTIONS} selected={data.borrowTolerance} onSelect={(v) => update('borrowTolerance', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">在你位置附近吃东西</label>
              <OptionButtons options={EAT_NEAR_DESK_OPTIONS} selected={data.eatNearDesk} onSelect={(v) => update('eatNearDesk', v)} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-2">公共空间使用偏好</label>
              <OptionButtons options={PUBLIC_SPACE_OPTIONS} selected={data.publicSpace} onSelect={(v) => update('publicSpace', v)} />
            </div>
          </div>
        )
      case 'communication':
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-gray-600 text-sm mb-2">有矛盾时偏好怎么解决</label>
              <OptionButtons options={CONFLICT_OPTIONS} selected={data.conflictResolution} onSelect={(v) => update('conflictResolution', v)} />
            </div>
            <YesNo label="愿意参与制定寝室公约" value={data.covenantWillingness} onChange={(v) => update('covenantWillingness', v)} />
            <div>
              <label className="block text-gray-600 text-sm mb-2">对轮值制度的态度</label>
              <OptionButtons options={DUTY_SYSTEM_OPTIONS} selected={data.dutySystem} onSelect={(v) => update('dutySystem', v)} />
            </div>
          </div>
        )
      case 'special':
        return (
          <div>
            <label className="block text-gray-600 text-sm mb-2">其他作息/生活说明（可选）</label>
            <textarea
              value={data.specialSchedule}
              onChange={(e) => update('specialSchedule', e.target.value)}
              placeholder="如：需要早起晨跑、深夜学习、对某种气味过敏、需要固定时间健身等"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 h-32 resize-none text-sm"
            />
          </div>
        )
      default:
        return null
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">偏好管理</h2>
        <p className="text-sm text-gray-500 mt-1">管理你的生活偏好，系统将据此协商最优公约方案</p>
      </div>

      {/* Section tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex gap-1 flex-wrap">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeSection === s.key ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-5">
          {sections.find(s => s.key === activeSection)?.icon}{' '}
          {sections.find(s => s.key === activeSection)?.label}
        </h3>
        {renderSection()}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition"
        >
          {loading ? '保存中...' : '保存所有偏好'}
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-xl text-sm ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {result.message}
        </div>
      )}
    </div>
  )
}
