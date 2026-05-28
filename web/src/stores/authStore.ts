import { create } from 'zustand'
import { UserProfile } from '../services/auth'

interface AuthStore {
  isAuthenticated: boolean
  isNewUser: boolean
  user: UserProfile | null
  roomId: string | null
  schoolId: string | null
  role: string | null
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
  roomId: null,
  schoolId: null,
  role: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    roomId: user?.room_id || null,
    schoolId: user?.school_id || null,
    role: user?.role || null,
  }),
  setRoomId: (roomId) => {
    set((state) => {
      if (state.user) {
        return { roomId, user: { ...state.user, room_id: roomId } }
      }
      return { roomId }
    })
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('habits_completed')
    set({ user: null, isAuthenticated: false, isNewUser: false, roomId: null, schoolId: null, role: null })
  },

  checkAuth: () => {
    return !!localStorage.getItem('access_token')
  },

  completeHabitCollection: () => {
    localStorage.setItem('habits_completed', 'true')
    set({ isNewUser: false })
  },
}))
