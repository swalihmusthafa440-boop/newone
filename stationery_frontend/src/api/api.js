import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stationery_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const url = originalRequest?.url || ''

    // Do not attempt token refresh for login, register, or token refresh endpoints
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/register') &&
      !url.includes('/auth/token/refresh')
    ) {
      const refresh = localStorage.getItem('stationery_refresh_token')
      if (refresh) {
        originalRequest._retry = true
        try {
          const res = await axios.post('/api/auth/token/refresh/', { refresh })
          const { access } = res.data
          localStorage.setItem('stationery_access_token', access)
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem('stationery_access_token')
          localStorage.removeItem('stationery_refresh_token')
          localStorage.removeItem('stationery_user')
        }
      }
    }
    return Promise.reject(error)
  }
)

export const getProducts = (params = {}) => api.get('/products/', { params })
export const getProductDetail = (id) => api.get(`/products/${id}/`)
export const getCategories = () => api.get('/categories/')
export const getSavedAddresses = () => api.get('/addresses/')
export const saveAddress = (data) => api.post('/addresses/', data)
export const deleteAddress = (id) => api.delete(`/addresses/${id}/`)
export const placeOrder = (data) => api.post('/orders/', data)
export const getOrder = (id) => api.get(`/orders/${id}/`)
export const getOrders = () => api.get('/orders/')
export const loginUser = (data) => api.post('/auth/login/', data)
export const registerUser = (data) => api.post('/auth/register/', data)
export const refreshToken = (refresh) => api.post('/auth/token/refresh/', { refresh })
export const getProfile = () => api.get('/auth/profile/')
export const updateProfile = (data) => api.patch('/auth/profile/', data)
export const getReviews = (productId) => api.get(`/products/${productId}/reviews/`)
export const addReview = (productId, data) => api.post(`/products/${productId}/reviews/`, data)
export const validateCoupon = (code, order_amount = 0) => api.post('/coupons/validate/', { code, order_amount })
export const getAdminStats = () => api.get('/admin-stats/')
export const updateProduct = (id, data) => api.patch(`/products/${id}/`, data)
export const createProduct = (data) => api.post('/products/', data)
export const deleteProduct = (id) => api.delete(`/products/${id}/`)
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/`, { status })
export const sendChatMessage = (message, context = {}, cart_items = []) => api.post('/chatbot/', { message, context, cart_items })

export default api
