import axios from 'axios'
import { storage } from '../utils/storage'

const API_BASE_URL = 'http://10.30.144.0:8000'  // 真机用局域网IP
// const API_BASE_URL = 'http://10.0.2.2:8000'  // Android模拟器用10.0.2.2访问localhost
// const API_BASE_URL = 'http://localhost:8000'  // iOS模拟器

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 自动添加token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 - 处理token过期
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clear()
      // 可以在这里触发跳转到登录页
    }
    return Promise.reject(error)
  }
)

export default apiClient
