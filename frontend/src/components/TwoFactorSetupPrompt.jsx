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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/[0.02] backdrop-blur border border-white/[0.08] rounded-2xl max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-white tracking-[-0.01em]">
            Secure Your Account
          </h2>
          <p className="text-gray-400 text-sm font-light leading-relaxed">
            Protect your tasks and earnings with two-factor authentication. Users with 2FA enabled can create unlimited tasks without stake limits.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleSetup('authenticator')}
            className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12] rounded-xl text-left transition-all duration-200 group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/[0.05] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.08] transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium mb-1">Authenticator App</h3>
                <p className="text-gray-400 text-xs font-light leading-relaxed">
                  Use Google Authenticator, Authy, or similar apps for time-based codes
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSetup('email')}
            className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12] rounded-xl text-left transition-all duration-200 group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/[0.05] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.08] transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium mb-1">Email Code</h3>
                <p className="text-gray-400 text-xs font-light leading-relaxed">
                  Receive 6-digit verification codes via email
                </p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onSkip}
          className="w-full py-2.5 px-4 text-gray-400 hover:text-white text-sm font-light transition-all duration-200"
        >
          Skip for now
        </button>

        <div className="pt-2 border-t border-white/[0.06]">
          <p className="text-xs text-gray-500 font-light text-center leading-relaxed">
            Without 2FA, you'll be limited to $20 total stake at risk. Enable 2FA anytime in Settings.
          </p>
        </div>
      </div>
    </div>
  )
}
