import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'stationery_access_token'
const REFRESH_KEY = 'stationery_refresh_token'
const USER_KEY = 'stationery_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { const u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) : null } catch { return null }
  })
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem(TOKEN_KEY) || null } catch { return null }
  })

  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login/', { username, password })
    const { access, refresh, user: userData } = res.data
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(access)
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register/', data)
    const { access, refresh, user: userData } = res.data
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(access)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((userData) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
  }, [])

  const isLoggedIn = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoggedIn, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
