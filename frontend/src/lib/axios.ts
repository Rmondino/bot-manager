import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    if (status === 422) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg).join(', ')
        : String(detail)
      return Promise.reject(new Error(msg))
    }
    if (status === 500) return Promise.reject(new Error('Error interno del servidor'))
    if (!err.response) return Promise.reject(new Error('Sin conexión con el servidor'))
    return Promise.reject(err)
  },
)

export default api
