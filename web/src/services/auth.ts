import apiClient from './api'

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user_id: string
  username: string
  school_id: string | null
  role: string
}

export interface UserProfile {
  user_id: string
  username: string
  email: string | null
  phone: string | null
  school_id: string
  credit_score: number
  is_email_verified: boolean
  is_phone_verified: boolean
  role: string
  room_id: string | null
  created_at: string
}

export interface OTPResponse {
  message: string
  target: string
  resend_in: number
}

export interface School {
  school_id: string
  school_name: string
  is_active: boolean
}

/**
 * 认证服务 - 邮箱和电话相关接口
 */
export const authService = {
  /**
   * 获取学校列表
   */
  getSchools: async (): Promise<{ schools: School[]; total: number }> => {
    const response = await apiClient.get('/api/v1/auth/schools')
    return response.data
  },

  /**
   * 发送邮箱OTP
   */
  sendEmailOTP: async (email: string): Promise<OTPResponse> => {
    const response = await apiClient.post('/api/v1/auth/email/send-otp', { email })
    return response.data
  },

  /**
   * 邮箱注册
   */
  registerWithEmail: async (
    email: string,
    otp: string,
    password: string,
    school_id: string
  ): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/v1/auth/email/register', {
      email,
      otp,
      password,
      school_id,
    })
    return response.data
  },

  /**
   * 邮箱登录
   */
  loginWithEmail: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/v1/auth/email/login', {
      email,
      password,
    })
    return response.data
  },

  /**
   * 发送电话OTP
   */
  sendPhoneOTP: async (phone: string): Promise<OTPResponse> => {
    const response = await apiClient.post('/api/v1/auth/phone/send-otp', { phone })
    return response.data
  },

  /**
   * 电话注册
   */
  registerWithPhone: async (
    phone: string,
    otp: string,
    password: string,
    school_id: string
  ): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/v1/auth/phone/register', {
      phone,
      otp,
      password,
      school_id,
    })
    return response.data
  },

  /**
   * 电话登录
   */
  loginWithPhone: async (phone: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/v1/auth/phone/login', {
      phone,
      password,
    })
    return response.data
  },

  /**
   * 获取用户资料
   */
  getUserProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/api/v1/auth/profile')
    return response.data
  },

  /**
   * 登出
   */
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },
}
