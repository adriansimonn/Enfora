import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'
import TwoFactorVerificationModal from '../components/TwoFactorVerificationModal'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState(null)
  const [twoFactorEmail, setTwoFactorEmail] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Enfora | Login'
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)

      if (result.requires2FA) {
        // 2FA is required
        setRequires2FA(true)
        setTwoFactorMethod(result.twoFactorMethod)
        setTwoFactorEmail(result.email)
        setLoading(false)
      } else {
        // Login successful
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handle2FAVerification = async (code, isBackupCode) => {
    try {
      await login(twoFactorEmail, password, code, isBackupCode)
      navigate('/dashboard')
    } catch (err) {
      throw err // Let modal handle the error
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md p-9 space-y-6 bg-white/[0.015] backdrop-blur border border-white/[0.06] rounded-2xl">
          <h1 className="text-3xl font-light text-center text-white tracking-[-0.01em]">
            Log In
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-normal mb-2 text-white">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/[0.12] text-white placeholder-gray-500 transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-normal mb-2 text-white">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/[0.12] text-white placeholder-gray-500 transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/[0.3] rounded-lg text-red-400 text-sm font-light">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white text-black disabled:bg-white/[0.03] disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg font-medium hover:bg-gray-100 transition-all duration-200"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => navigate('/signup')}
              className="text-sm text-gray-400 hover:text-white transition-all duration-200 font-light"
            >
              Don't have an account? <span className="text-white font-normal">Sign up</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Verification Modal */}
      {requires2FA && (
        <TwoFactorVerificationModal
          email={twoFactorEmail}
          method={twoFactorMethod}
          onVerify={handle2FAVerification}
          onClose={() => {
            setRequires2FA(false)
            setLoading(false)
          }}
        />
      )}
    </div>
  )
}
