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
    <div className="border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l border-yellow-400/60 pl-4">
          <div className="flex-1">
            <h3 className="text-[14px] font-normal text-white mb-0.5">
              Secure your account with two-factor authentication
            </h3>
            <p className="text-[13px] text-gray-400 font-light leading-relaxed">
              Without 2FA, you're limited to $20 total stake at risk. Enable 2FA to remove this limit and protect your account.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSetup}
              className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              Enable 2FA
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-500 hover:text-white transition-colors duration-200"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
