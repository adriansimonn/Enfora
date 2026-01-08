import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function TwoFactorEncouragementBanner({ onDismiss }) {
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) {
      onDismiss()
    }
  }

  const handleSetup = () => {
    navigate('/account/settings')
  }

  if (dismissed) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-l-4 border-yellow-500/50 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-200 mb-1">
                  Secure your account with two-factor authentication
                </h3>
                <p className="text-sm text-yellow-100/80 font-light leading-relaxed">
                  Without 2FA, you're limited to $20 total stake at risk. Enable 2FA to remove this limit and protect your account.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleSetup}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-medium rounded-lg transition-all duration-200"
                >
                  Enable 2FA
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-2 text-yellow-200 hover:text-white transition-colors"
                  aria-label="Dismiss"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
