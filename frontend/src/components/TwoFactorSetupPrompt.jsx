import { useState } from 'react'
import TwoFactorSetupModal from './TwoFactorSetupModal'

export default function TwoFactorSetupPrompt({ onComplete, onSkip }) {
  const [selectedMethod, setSelectedMethod] = useState(null)

  const handleSetup = (method) => {
    setSelectedMethod(method)
  }

  const handleSetupSuccess = () => {
    setSelectedMethod(null)
    onComplete()
  }

  const handleClose = () => {
    setSelectedMethod(null)
  }

  if (selectedMethod) {
    return (
      <TwoFactorSetupModal
        method={selectedMethod}
        onClose={handleClose}
        onSuccess={handleSetupSuccess}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl max-w-md w-full p-8">
        <h2 className="text-2xl font-light text-white tracking-[-0.01em] mb-3">
          Secure Your Account
        </h2>
        <p className="text-[14px] text-gray-400 font-light leading-relaxed mb-8">
          Protect your tasks and earnings with two-factor authentication. Users with 2FA enabled can create unlimited tasks without stake limits.
        </p>

        <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
          <button
            onClick={() => handleSetup('authenticator')}
            className="group w-full flex items-center justify-between gap-4 py-4 text-left"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] text-white font-normal mb-1">Authenticator App</h3>
              <p className="text-[13px] text-gray-400 font-light leading-relaxed">
                Use Google Authenticator, Authy, or similar apps for time-based codes
              </p>
            </div>
            <svg className="w-4 h-4 flex-shrink-0 text-gray-600 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => handleSetup('email')}
            className="group w-full flex items-center justify-between gap-4 py-4 text-left"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] text-white font-normal mb-1">Email Code</h3>
              <p className="text-[13px] text-gray-400 font-light leading-relaxed">
                Receive 6-digit verification codes via email
              </p>
            </div>
            <svg className="w-4 h-4 flex-shrink-0 text-gray-600 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={onSkip}
          className="w-full mt-6 py-2.5 px-4 text-sm text-gray-400 hover:text-white font-light transition-colors duration-200"
        >
          Skip for now
        </button>

        <p className="mt-3 text-[12px] text-gray-500 font-light text-center leading-relaxed">
          Without 2FA, you'll be limited to $20 total stake at risk. Enable 2FA anytime in Settings.
        </p>
      </div>
    </div>
  )
}
