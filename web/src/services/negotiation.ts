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

// ==================== 投票相关类型 ====================

export interface VoteOption {
  index: number
  text: string
  vote_count: number
  voter_ids: string[]
}

export interface VoteDetail {
  voteId: string
  roomId: string
  title: string
  description: string | null
  voteType: string
  status: 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXPIRED'
  options: VoteOption[]
  totalVoters: number
  totalVoted: number
  relatedPlanId: string | null
  createdAt: string
  expiresAt: string
  result: string | null
}

export interface VoteListResponse {
  votes: VoteDetail[]
  total: number
}

export interface CreateVoteRequest {
  room_id: string
  title: string
  description?: string
  options: string[]
  vote_type?: string
  related_plan_id?: string
  expires_in_hours?: number
}

export interface CastVoteRequest {
  vote_id: string
  option_index: number
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

  // 投票相关
  getVotes: async (roomId: string): Promise<VoteListResponse> => {
    const response = await apiClient.get('/api/v1/negotiation/votes/list', {
      params: { room_id: roomId },
    })
    return response.data.data
  },

  getVoteDetail: async (voteId: string): Promise<VoteDetail> => {
    const response = await apiClient.get(`/api/v1/negotiation/votes/${voteId}`)
    return response.data.data
  },

  createVote: async (data: CreateVoteRequest): Promise<VoteDetail> => {
    const response = await apiClient.post('/api/v1/negotiation/votes/create', data)
    return response.data.data
  },

  castVote: async (data: CastVoteRequest) => {
    const response = await apiClient.post('/api/v1/negotiation/votes/cast', data)
    return response.data.data
  },
}
