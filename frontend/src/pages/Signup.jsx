import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
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
      await register(email, password, username.trim(), displayName.trim() || username.trim())
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md p-9 space-y-6 bg-white/[0.015] backdrop-blur border border-white/[0.06] rounded-2xl">
          <h1 className="text-3xl font-light text-center text-white tracking-[-0.01em]">
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-normal mb-2 text-white">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/[0.12] text-white placeholder-gray-500 transition-all duration-200"
                placeholder="exampleusername123"
                pattern="[a-zA-Z0-9_-]{3,30}"
                title="3-30 characters: letters, numbers, hyphens, underscores only"
              />
              <p className="mt-1.5 text-xs text-gray-500 font-light">3-30 characters: letters, numbers, hyphens, underscores</p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-normal mb-2 text-white">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/[0.12] text-white placeholder-gray-500 transition-all duration-200"
                placeholder="Your Name (optional)"
              />
              <p className="mt-1.5 text-xs text-gray-500 font-light">Defaults to username if not provided</p>
            </div>

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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-normal mb-2 text-white">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-400 hover:text-white transition-all duration-200 font-light"
            >
              Already have an account? <span className="text-white font-normal">Log in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
