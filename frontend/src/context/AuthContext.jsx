import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { login as loginAPI, register as registerAPI, logout as logoutAPI, refreshAccessToken } from '../services/auth'
import { setAccessToken as setApiAccessToken } from '../services/api'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const refreshTimerRef = useRef(null)

  const updateAccessToken = (token) => {
    setAccessToken(token)
    setApiAccessToken(token)

    // Schedule token refresh (JWT tokens typically expire in 15 minutes)
    // Refresh 1 minute before expiry
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    refreshTimerRef.current = setTimeout(() => {
      refreshAccessToken()
        .then(data => {
          updateAccessToken(data.accessToken)
        })
        .catch(() => {
          // Refresh failed, clear auth state
          setAccessToken(null)
          setApiAccessToken(null)
          setUser(null)
          navigate('/login')
        })
    }, 14 * 60 * 1000) // Refresh after 14 minutes
  }

  useEffect(() => {
    // Try to refresh token on mount
    refreshAccessToken()
      .then(data => {
        updateAccessToken(data.accessToken)
      })
      .catch(() => {
        // No valid session
      })
      .finally(() => {
        setLoading(false)
      })

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  const login = async (email, password) => {
    const data = await loginAPI(email, password)
    updateAccessToken(data.accessToken)
    setUser(data.user)
    navigate('/')
  }

  const register = async (email, password) => {
    const data = await registerAPI(email, password)
    updateAccessToken(data.accessToken)
    setUser(data.user)
    navigate('/')
  }

  const logout = async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    await logoutAPI()
    setAccessToken(null)
    setApiAccessToken(null)
    setUser(null)
    navigate('/login')
  }

  const value = {
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!accessToken
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
