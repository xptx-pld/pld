import apiClient from './api'

export interface RoomMember {
  user_id: string
  username: string
  credit_score: number
  is_email_verified: boolean
  created_at: string
}

export interface RoomMembersResponse {
  room_id: string
  members: RoomMember[]
  total: number
}

export interface Activity {
  type: string
  title: string
  description: string
  time: string
  icon: string
}

export interface ActivityResponse {
  activities: Activity[]
  total: number
}

export interface RankingItem {
  rank: number
  user_id: string
  username: string
  credit_score: number
  is_self: boolean
}

export interface RankingResponse {
  ranking: RankingItem[]
  total: number
}

export interface CreateRoomResponse {
  room_id: string
  room_name: string
  capacity: number
  school_id: string
}

export interface JoinRoomResponse {
  room_id: string
  room_name: string
}

export const roomService = {
  createRoom: async (roomName: string, capacity: number): Promise<CreateRoomResponse> => {
    const response = await apiClient.post('/api/v1/room/create', {
      room_name: roomName,
      capacity,
    })
    return response.data
  },

  joinRoom: async (roomId: string): Promise<JoinRoomResponse> => {
    const response = await apiClient.post('/api/v1/room/join', {
      room_id: roomId,
    })
    return response.data
  },

  getMembers: async (): Promise<RoomMembersResponse> => {
    const response = await apiClient.get('/api/v1/room/members')
    return response.data
  },

  getActivities: async (): Promise<ActivityResponse> => {
    const response = await apiClient.get('/api/v1/room/activities')
    return response.data
  },

  getRanking: async (): Promise<RankingResponse> => {
    const response = await apiClient.get('/api/v1/room/ranking')
    return response.data
  },
}
