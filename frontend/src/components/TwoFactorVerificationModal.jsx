import { useState } from 'react'
import { send2FAEmailCode } from '../services/twoFactor'

export default function TwoFactorVerificationModal({ email, method, onVerify, onClose }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSendEmailCode = async () => {
    setLoading(true)
    setError('')
    try {
      await send2FAEmailCode(email)
      setEmailSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (code.length < 6) {
      setError('Please enter a valid code')
      return
    }

    setLoading(true)
    setError('')
    try {
      await onVerify(code, useBackupCode)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleCodeChange = (value) => {
    const cleaned = value.replace(/\s/g, '')
    if (useBackupCode) {
      // Backup codes are 8 characters (hex)
      setCode(cleaned.toUpperCase().slice(0, 8))
    } else {
      // Regular codes are 6 digits
      setCode(cleaned.replace(/\D/g, '').slice(0, 6))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">Two-Factor Authentication</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-all duration-200 p-1 hover:bg-white/[0.06] rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl border bg-red-500/10 border-red-500/20 text-red-400">
              <p className="font-light text-sm">{error}</p>
            </div>
          )}

          {!useBackupCode ? (
            <>
              <p className="text-gray-300 font-light text-sm">
                {method === 'authenticator'
                  ? 'Enter the 6-digit code from your authenticator app'
                  : 'Enter the 6-digit code sent to your email'}
              </p>

              {method === 'email' && !emailSent && (
                <button
                  onClick={handleSendEmailCode}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Code to Email'}
                </button>
              )}

              {(method === 'authenticator' || emailSent) && (
                <>
                  <div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      maxLength={6}
                      placeholder="000000"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-center text-2xl tracking-widest font-light focus:outline-none focus:border-white/[0.12] transition-all"
                      autoFocus
                    />
                  </div>

                  {method === 'email' && (
                    <p className="text-xs text-gray-500 font-light text-center">
                      The code will expire in 10 minutes
                    </p>
                  )}

                  <button
                    onClick={handleVerify}
                    disabled={loading || code.length !== 6}
                    className="w-full px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setUseBackupCode(true)
                  setCode('')
                  setError('')
                }}
                className="w-full text-sm text-gray-400 hover:text-white transition-all duration-200 font-light"
              >
                Use a backup code instead
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-300 font-light text-sm">
                Enter one of your backup codes (8 characters)
              </p>

              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  maxLength={8}
                  placeholder="XXXXXXXX"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-center text-xl tracking-wider font-mono focus:outline-none focus:border-white/[0.12] transition-all"
                  autoFocus
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-yellow-400 font-light text-sm">
                  Note: This backup code will be deleted after use
                </p>
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || code.length !== 8}
                className="w-full px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Backup Code'}
              </button>

              <button
                onClick={() => {
                  setUseBackupCode(false)
                  setCode('')
                  setError('')
                }}
                className="w-full text-sm text-gray-400 hover:text-white transition-all duration-200 font-light"
              >
                Use {method === 'authenticator' ? 'authenticator app' : 'email code'} instead
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
