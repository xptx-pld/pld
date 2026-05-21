import { create } from 'zustand'
import { authService, UserProfile, LoginResponse } from '../services/auth'
import { storage } from '../utils/storage'

interface AuthState {
  isAuthenticated: boolean
  isNewUser: boolean
  user: UserProfile | null
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, otp: string, password: string) => Promise<boolean>
  sendOTP: (email: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  completeHabitCollection: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isNewUser: false,
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.loginWithEmail(email, password)
      await storage.set('access_token', response.access_token)
      await storage.set('refresh_token', response.refresh_token)

      const user = await authService.getUserProfile()
      const habitsCompleted = await storage.get('habits_completed')
      set({
        isAuthenticated: true,
        user,
        isLoading: false,
        isNewUser: !habitsCompleted
      })
      return true
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || '登录失败，请重试'
      })
      return false
    }
  },

  register: async (email: string, otp: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.registerWithEmail(email, otp, password)
      await storage.set('access_token', response.access_token)
      await storage.set('refresh_token', response.refresh_token)

      const user = await authService.getUserProfile()
      set({ isAuthenticated: true, user, isLoading: false, isNewUser: true })
      return true
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || '注册失败，请重试'
      })
      return false
    }
  },

  sendOTP: async (email: string) => {
    set({ isLoading: true, error: null })
    try {
      await authService.sendEmailOTP(email)
      set({ isLoading: false })
      return true
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || '发送验证码失败'
      })
      return false
    }
  },

  logout: async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      await storage.clear()
      set({ isAuthenticated: false, user: null, isNewUser: false })
    }
  },

  checkAuth: async () => {
    const token = await storage.get('access_token')
    if (!token) {
      set({ isAuthenticated: false })
      return
    }

    try {
      const user = await authService.getUserProfile()
      const habitsCompleted = await storage.get('habits_completed')
      set({ isAuthenticated: true, user, isNewUser: !habitsCompleted })
    } catch (error) {
      await storage.clear()
      set({ isAuthenticated: false })
    }
  },

  completeHabitCollection: async () => {
    await storage.set('habits_completed', 'true')
    set({ isNewUser: false })
  },

  clearError: () => set({ error: null }),
}))
