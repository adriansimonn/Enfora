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
    <div className="min-h-screen bg-black selection:bg-white selection:text-black">
      <Navigation />

      <div className="flex justify-center px-6 pt-24 pb-28">
        <div className="w-full max-w-sm">
          <h1 className="text-4xl font-light text-white tracking-[-0.02em] leading-[1.1] mb-10">
            Log In
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[13px] font-normal mb-2 text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-normal mb-2 text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.08]">
            <button
              onClick={() => navigate('/signup')}
              className="text-[13px] text-gray-400 hover:text-white transition-colors duration-200 font-light"
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
