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
}

export interface ViolationResponse {
  userId: string
  deductedPoints: number
  remainingCreditScore: number
  votingWeightModifier: number
  broadcastNotice: string
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
}
