import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { login as loginAPI, register as registerAPI, logout as logoutAPI, refreshAccessToken } from '../services/auth'
import { setAccessToken as setApiAccessToken } from '../services/api'
import emblemLogo from '../assets/logos/emblem_logo_t.png'

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
    // Try to refresh token on mount
    console.log('AuthContext: Attempting to refresh token on mount...')
    refreshAccessToken()
      .then(data => {
        console.log('AuthContext: Refresh successful', data)
        updateAccessToken(data.accessToken)
        // Set user data from refresh response
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch((err) => {
        console.log('AuthContext: Refresh failed', err.message)
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
    return data
  }

  const register = async (email, password, username, displayName) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Pulsing glow effect */}
            <div className="absolute inset-0 blur-xl opacity-50 animate-pulse">
              <div className="w-32 h-32 bg-white/30 rounded-full"></div>
            </div>
            {/* Logo */}
            <img
              src={emblemLogo}
              alt="Enfora Logo"
              className="w-32 h-32 relative z-10 animate-pulse"
            />
          </div>
          <p className="text-gray-400 mt-8 text-base animate-pulse">Loading...</p>
        </div>
      </div>
    )
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
