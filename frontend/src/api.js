import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(t) {
  localStorage.setItem('token', t)
}

export const api = axios.create({
  baseURL: API_BASE,
  // Let axios set content-type per-request (FormData vs JSON)
})

api.interceptors.request.use((cfg) => {
  const token = getToken()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export default api
