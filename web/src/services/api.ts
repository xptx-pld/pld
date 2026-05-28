import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * API客户端配置
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 请求拦截器 - 添加Authorization Token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器 - 处理401和刷新Token
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    // 处理401 Unauthorized - Token过期
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token } = response.data

        // 保存新的tokens
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)

        // 更新请求头
        originalRequest.headers.Authorization = `Bearer ${access_token}`

        // 重试原始请求
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh失败，清除tokens并重定向到登录
        const { logout } = useAuthStore.getState()
        logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
