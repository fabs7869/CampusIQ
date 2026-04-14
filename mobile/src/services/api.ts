import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const API_URL = 'http://192.168.29.250:8000/api/v1'
export const BASE_URL = 'http://192.168.29.250:8000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.patch('/users/me', data),
  getBadgeStatus: () => api.get('/users/me/badge-status'),
  updateActivity: (data: any) => api.put('/users/me/activity', data),
  changePassword: (data: any) => api.post('/auth/change-password', data),
}

// ─── Complaints ─────────────────────────────────────────────────────────────
export const complaintsAPI = {
  list: (params?: any) => api.get('/complaints', { params }),
  get: (id: string) => api.get(`/complaints/${id}`),
  submit: async (formData: FormData) => {
    // Axios has known bugs with FormData on React Native, so we use native fetch for file uploads.
    const token = await AsyncStorage.getItem('access_token');
    const response = await fetch(`${API_URL}/complaints`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json();
    if (!response.ok) {
       throw { message: data.detail || 'Failed to submit complaint', response: { data } };
    }
    return { data };
  },

  upvote: (id: string) => api.post(`/complaints/${id}/upvote`),
}

// ─── Feed ───────────────────────────────────────────────────────────────────
export const feedAPI = {
  getResolutionFeed: (params?: any) => api.get('/feed/resolved', { params }),
}

// ─── Notifications ──────────────────────────────────────────────────────────
export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  clearAll: () => api.delete('/notifications/clear-all'),
  clearSelected: (ids: string[]) => api.post('/notifications/clear-selected', ids),
  getUnreadCount: () => api.get('/notifications/unread-count'),
}

// ─── Support ───────────────────────────────────────────────────────────────
export const supportAPI = {
  reportBug: (data: { description: string, device_info?: string, app_version?: string }) =>
    api.post('/support/report-bug', data),
}

// ─── Analytics ─────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getCampusPulse: () => api.get('/analytics/campus-pulse'),
  getCategoryPrediction: (category: string) => api.get(`/analytics/prediction/${category}`),
  getUserImpact: () => api.get('/analytics/user-impact'),
  suggestCategory: (title: string, description: string) => api.post('/analytics/suggest-category', { title, description }),
}

// ─── WebSocket ──────────────────────────────────────────────────────────────
export const createWebSocket = (userId: string) => {
  const ws = new WebSocket(`ws://192.168.29.250:8000/ws/${userId}`)
  ws.onopen = () => {
    console.log('[WS] Connected')
    setInterval(() => ws.send('ping'), 30000)
  }
  ws.onclose = () => console.log('[WS] Disconnected')
  return ws
}

export default api
