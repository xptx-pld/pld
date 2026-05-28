import apiClient from './api'

export interface ExplicitPreferenceRequest {
  user_id: string
  room_id: string
  sleep_time: string
  ac_temp_preference: number
  noise_tolerance_level: number
}

export interface PreferenceSaveResponse {
  userId: string
  roomId: string
  sleepTime: string
  acTempPreference: number
  noiseToleranceLevel: number
  saved: boolean
}

export interface FullPreferenceData {
  room_id: string
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

// Convert camelCase keys to snake_case for backend
function toSnakeCase(data: FullPreferenceData) {
  const map: Record<string, string> = {
    sleepTime: 'sleep_time',
    wakeTime: 'wake_time',
    expectedSleepTime: 'expected_sleep_time',
    expectedWakeTime: 'expected_wake_time',
    weekendDiff: 'weekend_diff',
    alarmHabit: 'alarm_habit',
    napHabit: 'nap_habit',
    stayUpLate: 'stay_up_late',
    cleanLevel: 'clean_level',
    showerFreq: 'shower_freq',
    clothesWash: 'clothes_wash',
    trashDuty: 'trash_duty',
    mealRegularity: 'meal_regularity',
    strongFood: 'strong_food',
    deliveryFreq: 'delivery_freq',
    tempPreference: 'temp_preference',
    windowVentilation: 'window_ventilation',
    lightPreference: 'light_preference',
    acHabit: 'ac_habit',
    nightLight: 'night_light',
    noiseSensitivity: 'noise_sensitivity',
    useHeadphones: 'use_headphones',
    gameVideoSound: 'game_video_sound',
    videoCallTolerance: 'video_call_tolerance',
    videoCallFreq: 'video_call_freq',
    bringFriends: 'bring_friends',
    studyLocation: 'study_location',
    quietStudy: 'quiet_study',
    examBehavior: 'exam_behavior',
    remoteWork: 'remote_work',
    roomTime: 'room_time',
    itemSharing: 'item_sharing',
    borrowTolerance: 'borrow_tolerance',
    eatNearDesk: 'eat_near_desk',
    publicSpace: 'public_space',
    conflictResolution: 'conflict_resolution',
    covenantWillingness: 'covenant_willingness',
    dutySystem: 'duty_system',
    specialSchedule: 'special_schedule',
    hasPartner: 'has_partner',
    partnerCallFreq: 'partner_call_freq',
  }
  const result: Record<string, any> = { room_id: data.room_id }
  for (const [key, value] of Object.entries(data)) {
    if (key === 'room_id') continue
    const snakeKey = map[key] || key
    result[snakeKey] = value
  }
  return result
}

export const preferenceService = {
  submitExplicitPreference: async (data: ExplicitPreferenceRequest): Promise<PreferenceSaveResponse> => {
    const response = await apiClient.post('/api/v1/preferences/explicit', data)
    return response.data.data
  },

  submitFullPreference: async (data: FullPreferenceData) => {
    const response = await apiClient.post('/api/v1/preferences/full', toSnakeCase(data))
    return response.data.data
  },

  getMyPreference: async (): Promise<FullPreferenceData | null> => {
    const response = await apiClient.get('/api/v1/preferences/my')
    return response.data.data
  },
}
