import apiClient from './api'

export interface ExplicitProfile {
  sleepTime: string
  acTemp: number
}

export interface ImplicitProfile {
  actualAverageSleepTime: string
  actualAcTemp: number
}

export interface ContrastReportResponse {
  userId: string
  explicitProfile: ExplicitProfile
  implicitProfile: ImplicitProfile
  conflictTags: string[]
  conclusion: string
}

export interface ConflictPredictionResponse {
  roomId: string
  warningLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  probability: number
  triggerFactors: string[]
  predictionMessage: string
}

export const insightService = {
  getContrastReport: async (userId: string): Promise<ContrastReportResponse> => {
    const response = await apiClient.get('/api/v1/insights/contrast-report', {
      params: { user_id: userId },
    })
    return response.data.data
  },

  getConflictPrediction: async (roomId: string): Promise<ConflictPredictionResponse> => {
    const response = await apiClient.get('/api/v1/insights/conflict-prediction', {
      params: { room_id: roomId },
    })
    return response.data.data
  },
}
