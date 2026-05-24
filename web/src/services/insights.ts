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

export interface TrendDataset {
  label: string
  data: number[]
  color: string
}

export interface TrendsResponse {
  labels: string[]
  datasets: TrendDataset[]
}

export interface RoomMemberComparison {
  user_id: string
  username: string
  credit_score: number
  violation_count: number
  sleep_time: string | null
  noise_tolerance: number | null
}

export interface ComparisonMetric {
  key: string
  label: string
  max: number
}

export interface RoomComparisonResponse {
  members: RoomMemberComparison[]
  metrics: ComparisonMetric[]
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

  getTrends: async (): Promise<TrendsResponse> => {
    const response = await apiClient.get('/api/v1/insights/trends')
    return response.data.data
  },

  getRoomComparison: async (): Promise<RoomComparisonResponse> => {
    const response = await apiClient.get('/api/v1/insights/room-comparison')
    return response.data.data
  },
}
