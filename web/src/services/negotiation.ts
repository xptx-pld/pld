import apiClient from './api'

export interface SatisfactionPoint {
  planId: string
  satisfactionVector: number[]
  details: Record<string, string | number>
}

export interface ParetoFrontierResponse {
  roomId: string
  dimensions: string[]
  points: SatisfactionPoint[]
}

export interface OptimalSolution {
  planId: string
  mathematicalBasis: string
  description: string
  details: Record<string, string | number>
}

export interface OptimalSolutionsResponse {
  roomId: string
  nashSolution: OptimalSolution
  kalaiSmarodinskySolution: OptimalSolution
}

export interface CommitPlanRequest {
  room_id: string
  chosen_plan_id: string
  custom_adjustment?: Record<string, string | number>
  agreed_user_ids: string[]
}

export interface CommitPlanResponse {
  roomId: string
  chosenPlanId: string
  agreedUserIds: string[]
  status: string
  message: string
}

export const negotiationService = {
  getParetoFrontier: async (roomId: string): Promise<ParetoFrontierResponse> => {
    const response = await apiClient.get('/api/v1/negotiation/pareto-frontier', {
      params: { room_id: roomId },
    })
    return response.data.data
  },

  getOptimalSolutions: async (roomId: string): Promise<OptimalSolutionsResponse> => {
    const response = await apiClient.get('/api/v1/negotiation/optimal-solutions', {
      params: { room_id: roomId },
    })
    return response.data.data
  },

  commitPlan: async (data: CommitPlanRequest): Promise<CommitPlanResponse> => {
    const response = await apiClient.post('/api/v1/negotiation/commit-plan', data)
    return response.data.data
  },
}
