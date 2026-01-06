import { useState, useEffect, useRef } from 'react'

export default function VerificationModal({ email, onVerify, onResend, onClose }) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Handle paste
    if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('')
        const newCode = [...code]
        digits.forEach((digit, i) => {
          if (i < 6) newCode[i] = digit
        })
        setCode(newCode)

        // Focus last filled input or first empty
        const lastIndex = Math.min(digits.length, 5)
        inputRefs.current[lastIndex]?.focus()
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const verificationCode = code.join('')

    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      await onVerify(verificationCode)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    setResendSuccess(false)

    try {
      await onResend()
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/[0.02] backdrop-blur border border-white/[0.08] rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-light text-white text-center mb-2">
          Verify Your Email
        </h2>
        <p className="text-gray-400 text-center text-sm mb-6">
          We sent a 6-digit code to <span className="text-white font-normal">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-semibold bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/[0.12] text-white transition-all duration-200"
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/[0.3] rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="p-3 bg-green-500/10 border border-green-500/[0.3] rounded-lg text-green-400 text-sm text-center">
              Verification code resent successfully
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.some((d) => !d)}
            className="w-full py-3 px-4 bg-white text-black disabled:bg-white/[0.03] disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg font-medium hover:bg-gray-100 transition-all duration-200"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={handleResend}
            disabled={resending || loading}
            className="text-sm text-gray-400 hover:text-white transition-all duration-200 disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            {resending ? 'Resending...' : "Didn't receive the code? Resend"}
          </button>

          <div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-sm text-gray-400 hover:text-white transition-all duration-200 disabled:text-gray-600"
            >
              Back to signup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
