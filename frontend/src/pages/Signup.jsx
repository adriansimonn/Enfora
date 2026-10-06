import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import VerificationModal from '../components/VerificationModal'
import TwoFactorSetupPrompt from '../components/TwoFactorSetupPrompt'
import { verifyEmail, resendVerificationCode } from '../services/auth'
import { setAccessToken as setApiAccessToken } from '../services/api'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [show2FAPrompt, setShow2FAPrompt] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Enfora | Sign Up';
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!username || username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    setLoading(true)

    try {
      const { register } = await import('../services/auth')
      await register(email, password, username.trim(), displayName.trim() || username.trim())

      // Registration successful - verification code sent
      setPendingEmail(email)
      setShowVerification(true)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (code) => {
    try {
      const data = await verifyEmail(pendingEmail, code)

      // Set the access token for API calls
      setApiAccessToken(data.accessToken)

      // Show 2FA setup prompt after successful verification
      setShowVerification(false)
      setShow2FAPrompt(true)
    } catch (err) {
      throw err
    }
  }

  const handle2FAComplete = () => {
    setShow2FAPrompt(false)
    navigate('/dashboard')
    window.location.reload()
  }

  const handle2FASkip = () => {
    setShow2FAPrompt(false)
    navigate('/dashboard')
    window.location.reload()
  }

  const handleResend = async () => {
    await resendVerificationCode(pendingEmail)
  }

  const handleCloseVerification = () => {
    setShowVerification(false)
    setPendingEmail('')
  }

  return (
    <div className="min-h-screen bg-black selection:bg-white selection:text-black">
      <Navigation />

      {showVerification && (
        <VerificationModal
          email={pendingEmail}
          onVerify={handleVerify}
          onResend={handleResend}
          onClose={handleCloseVerification}
        />
      )}

      {show2FAPrompt && (
        <TwoFactorSetupPrompt
          onComplete={handle2FAComplete}
          onSkip={handle2FASkip}
        />
      )}

      <div className="flex justify-center px-6 pt-24 pb-28">
        <div className="w-full max-w-sm">
          <h1 className="text-4xl font-light text-white tracking-[-0.02em] leading-[1.1] mb-10">
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-[13px] font-normal mb-2 text-gray-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                placeholder="exampleusername123"
                pattern="[a-zA-Z0-9_-]{3,30}"
                title="3-30 characters: letters, numbers, hyphens, underscores only"
              />
              <p className="mt-2 text-[12px] text-gray-500 font-light">3-30 characters: letters, numbers, hyphens, underscores</p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-[13px] font-normal mb-2 text-gray-300">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                placeholder="Your Name (optional)"
              />
              <p className="mt-2 text-[12px] text-gray-500 font-light">Defaults to username if not provided</p>
            </div>

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

            <div>
              <label htmlFor="confirmPassword" className="block text-[13px] font-normal mb-2 text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.08]">
            <button
              onClick={() => navigate('/login')}
              className="text-[13px] text-gray-400 hover:text-white transition-colors duration-200 font-light"
            >
              Already have an account? <span className="text-white font-normal">Log in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
