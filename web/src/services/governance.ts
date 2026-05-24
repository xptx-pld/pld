import apiClient from './api'

export interface IoTRule {
  rule_id: string
  target_device: string
  cron_expression: string
  execution_action: string
  payload: Record<string, string | number>
}

export interface SyncIoTRulesRequest {
  room_id: string
  rules: IoTRule[]
}

export interface SyncIoTRulesResponse {
  roomId: string
  rulesCount: number
  synced: boolean
  message: string
}

export interface ViolationRequest {
  room_id: string
  violator_id: string
  rule_type: string
  evidence_log: string
  evidence_images?: string[]
}

export interface ViolationResponse {
  userId: string
  deductedPoints: number
  remainingCreditScore: number
  votingWeightModifier: number
  broadcastNotice: string
  evidenceImages?: string[]
}

export interface ExecutionReport {
  totalViolationsRecorded: number
  mostFrictionRule: string
  behaviorShiftTrend: string
}

export interface InitiateRevisionResponse {
  roomId: string
  cycleId: string
  executionReport: ExecutionReport
  voteSessionId: string
  status: string
}

export interface NVCRequest {
  room_id: string
  conflict_type: string
  involved_parties: string[]
  recent_friction_count: number
}

export interface TransitionalPlan {
  lightsOffTime: string
  acTemp: number
  specialClause: string
}

export interface NVCResponse {
  roomId: string
  mediationNarrative: string
  suggestedTransitionalPlan: TransitionalPlan
}

// ==================== 公约历史相关类型 ====================

export interface CovenantPlan {
  planId: string
  type: string
  rules: Record<string, string | number>
}

export interface CovenantVoteResult {
  totalVoters: number
  agreeCount: number
  disagreeCount: number
  status: string
}

export interface CovenantCycle {
  cycleId: string
  status: 'ACTIVE' | 'SUPERSEDED' | 'EXPIRED'
  createdAt: string
  plan: CovenantPlan
  voteResult: CovenantVoteResult
}

export interface CovenantHistoryResponse {
  roomId: string
  history: CovenantCycle[]
  total: number
}

// ==================== 治理投票相关类型 ====================

export interface GovernanceVoteOption {
  index: number
  text: string
  vote_count: number
  voter_ids: string[]
}

export interface GovernanceVote {
  voteId: string
  title: string
  description: string
  voteType: string
  status: string
  options: GovernanceVoteOption[]
  totalVoters: number
  totalVoted: number
  createdAt: string
  expiresAt: string
}

export interface GovernanceVotesResponse {
  votes: GovernanceVote[]
  total: number
}

export const governanceService = {
  syncIoTRules: async (data: SyncIoTRulesRequest): Promise<SyncIoTRulesResponse> => {
    const response = await apiClient.post('/api/v1/governance/sync-iot-rules', data)
    return response.data.data
  },

  reportViolation: async (data: ViolationRequest): Promise<ViolationResponse> => {
    const response = await apiClient.post('/api/v1/governance/violations', data)
    return response.data.data
  },

  initiateRevision: async (roomId: string): Promise<InitiateRevisionResponse> => {
    const response = await apiClient.post('/api/v1/governance/revisions/initiate', null, {
      params: { room_id: roomId },
    })
    return response.data.data
  },

  generateNVCMediation: async (data: NVCRequest): Promise<NVCResponse> => {
    const response = await apiClient.post('/api/v1/governance/mediation/nvc-generate', data)
    return response.data.data
  },

  getCovenantHistory: async (roomId: string): Promise<CovenantHistoryResponse> => {
    const response = await apiClient.get('/api/v1/governance/covenant-history', {
      params: { room_id: roomId },
    })
    return response.data.data
  },

  getActiveVotes: async (roomId: string): Promise<GovernanceVotesResponse> => {
    const response = await apiClient.get('/api/v1/governance/votes/active', {
      params: { room_id: roomId },
    })
    return response.data.data
  },

  castVote: async (voteId: string, optionIndex: number) => {
    const response = await apiClient.post('/api/v1/negotiation/votes/cast', {
      vote_id: voteId,
      option_index: optionIndex,
    })
    return response.data.data
  },
}
