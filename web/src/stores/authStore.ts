import { create } from 'zustand'
import { UserProfile } from '../services/auth'

interface AuthStore {
  isAuthenticated: boolean
  isNewUser: boolean
  user: UserProfile | null
  roomId: string | null
  isLoading: boolean
  error: string | null
  setUser: (user: UserProfile | null) => void
  setRoomId: (roomId: string | null) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  checkAuth: () => boolean
  completeHabitCollection: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: !!localStorage.getItem('access_token'),
  isNewUser: !localStorage.getItem('habits_completed'),
  user: null,
  roomId: localStorage.getItem('room_id'),
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setRoomId: (roomId) => {
    if (roomId) {
      localStorage.setItem('room_id', roomId)
    } else {
      localStorage.removeItem('room_id')
    }
    set({ roomId })
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('room_id')
    set({ user: null, isAuthenticated: false, isNewUser: false, roomId: null })
  },

  checkAuth: () => {
    return !!localStorage.getItem('access_token')
  },

  completeHabitCollection: () => {
    localStorage.setItem('habits_completed', 'true')
    set({ isNewUser: false })
  },
}))
