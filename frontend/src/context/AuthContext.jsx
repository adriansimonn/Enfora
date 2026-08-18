import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { login as loginAPI, register as registerAPI, logout as logoutAPI, refreshAccessToken } from '../services/auth'
import { setAccessToken as setApiAccessToken, initializeCsrfToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)
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
          // Update user data from refresh response
          if (data.user) {
            setUser(data.user)
          }
        })
        .catch(() => {
          // Refresh failed, clear auth state
          setAccessToken(null)
          setApiAccessToken(null)
          setUser(null)
        })
    }, 14 * 60 * 1000) // Refresh after 14 minutes
  }

  useEffect(() => {
    // Initialize CSRF token then try to refresh access token on mount
    const initializeAuth = async () => {
      await initializeCsrfToken()

      try {
        const data = await refreshAccessToken()
        updateAccessToken(data.accessToken)
        // Set user data from refresh response
        if (data.user) {
          setUser(data.user)
        }
      } catch (err) {
        // No valid session
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  const login = async (email, password, twoFactorCode = null, isBackupCode = false) => {
    // Ensure CSRF token is available before login
    await initializeCsrfToken()

    const data = await loginAPI(email, password, twoFactorCode, isBackupCode)

    // Check if 2FA is required
    if (data.requires2FA) {
      return data // Return 2FA requirement info without setting tokens
    }

    // Normal login flow - set tokens and user
    updateAccessToken(data.accessToken)
    setUser(data.user)
    return data
  }

  const register = async (email, password, username, displayName) => {
    // Ensure CSRF token is available before registration
    await initializeCsrfToken()

    const data = await registerAPI(email, password, username, displayName)
    updateAccessToken(data.accessToken)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    await logoutAPI()
    setAccessToken(null)
    setApiAccessToken(null)
    setUser(null)
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
