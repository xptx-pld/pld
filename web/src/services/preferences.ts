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

export const preferenceService = {
  submitExplicitPreference: async (data: ExplicitPreferenceRequest): Promise<PreferenceSaveResponse> => {
    const response = await apiClient.post('/api/v1/preferences/explicit', data)
    return response.data.data
  },
}
