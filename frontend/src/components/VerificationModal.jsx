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
      <div className="bg-black border border-white/[0.08] rounded-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-light text-white text-center tracking-[-0.01em] mb-2">
          Verify Your Email
        </h2>
        <p className="text-[14px] text-gray-400 font-light text-center mb-8">
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
                className="w-12 h-14 text-center text-2xl font-light tabular-nums bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:border-white/[0.3] text-white transition-colors duration-200"
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <p className="border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light leading-relaxed">
              {error}
            </p>
          )}

          {resendSuccess && (
            <p className="border-l border-green-400/60 pl-4 text-[13px] text-green-400 font-light leading-relaxed">
              Verification code resent successfully
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.some((d) => !d)}
            className="w-full px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/[0.08] text-center space-y-3">
          <button
            onClick={handleResend}
            disabled={resending || loading}
            className="text-[13px] text-gray-400 hover:text-white font-light transition-colors duration-200 disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            {resending ? 'Resending...' : "Didn't receive the code? Resend"}
          </button>

          <div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-[13px] text-gray-400 hover:text-white font-light transition-colors duration-200 disabled:text-gray-600"
            >
              Back to signup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
