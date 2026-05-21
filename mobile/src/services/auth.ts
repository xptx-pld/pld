import apiClient from './api'

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user_id: string
  username: string
}

export interface UserProfile {
  user_id: string
  username: string
  email: string | null
  phone: string | null
  credit_score: number
  is_email_verified: boolean
  is_phone_verified: boolean
  created_at: string
}

export interface OTPResponse {
  message: string
  target: string
  resend_in: number
}

export const authService = {
  sendEmailOTP: async (email: string): Promise<OTPResponse> => {
    const response = await apiClient.post('/api/v1/auth/email/send-otp', { email })
    return response.data
  },

  registerWithEmail: async (
    email: string,
    otp: string,
    password: string
  ): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/v1/auth/email/register', {
      email,
      otp,
      password,
    })
    return response.data
  },

  loginWithEmail: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/v1/auth/email/login', {
      email,
      password,
    })
    return response.data
  },

  getUserProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/api/v1/auth/profile')
    return response.data
  },

  logout: async () => {
    await apiClient.post('/api/v1/auth/logout')
  },
}
