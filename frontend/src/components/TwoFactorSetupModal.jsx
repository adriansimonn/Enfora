import { useState } from 'react'
import { setupAuthenticator, verifyAuthenticatorSetup, setupEmail2FA } from '../services/twoFactor'

export default function TwoFactorSetupModal({ method, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Authenticator setup data
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [verificationCode, setVerificationCode] = useState('')
  const [savedBackupCodes, setSavedBackupCodes] = useState(false)

  const handleStartAuthenticatorSetup = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await setupAuthenticator()
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setBackupCodes(data.backupCodes)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAuthenticator = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    setError('')
    try {
      await verifyAuthenticatorSetup(verificationCode, backupCodes)
      setStep(3) // Show backup codes
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupEmailFactor = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await setupEmail2FA()
      setBackupCodes(data.backupCodes)
      setStep(2) // Show backup codes
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackupCodes = () => {
    const text = backupCodes.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'enfora-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
    setSavedBackupCodes(true)
  }

  const handleCopyBackupCodes = () => {
    const text = backupCodes.join('\n')
    navigator.clipboard.writeText(text)
    setSavedBackupCodes(true)
  }

  const handleComplete = () => {
    onSuccess()
    onClose()
  }

  const authenticatorSteps = [
    'Download an authenticator app like Google Authenticator, Authy, or 1Password',
    'Click Continue to get your QR code',
    'Scan the QR code with your authenticator app',
    'Enter the verification code from your app'
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08] sticky top-0 bg-black z-10">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">
            {method === 'authenticator' ? 'Setup Authenticator App' : 'Setup Email 2FA'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-gray-500 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <p className="border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light leading-relaxed mb-6">{error}</p>
          )}

          {/* Authenticator App Setup */}
          {method === 'authenticator' && (
            <>
              {step === 1 && (
                <div className="space-y-6">
                  <p className="text-[14px] text-gray-300 font-light">
                    To set up two-factor authentication with an authenticator app:
                  </p>
                  <ol className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                    {authenticatorSteps.map((text, index) => (
                      <li key={index} className="flex gap-5 items-baseline py-3.5">
                        <span className="flex-shrink-0 text-white/30 font-light text-[15px] tabular-nums">0{index + 1}</span>
                        <span className="text-[14px] text-gray-300 font-light leading-relaxed">{text}</span>
                      </li>
                    ))}
                  </ol>
                  <button
                    onClick={handleStartAuthenticatorSetup}
                    disabled={loading}
                    className="w-full px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'Continue'}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <p className="text-[14px] text-gray-300 font-light">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img src={qrCode} alt="QR Code" className="w-56 h-56" />
                  </div>
                  <div className="border-l border-white/[0.15] pl-4">
                    <p className="text-[12px] text-gray-500 font-light mb-1">Or enter this code manually:</p>
                    <code className="text-white font-mono text-[13px] break-all">{secret}</code>
                  </div>
                  <div>
                    <label className="block text-[13px] font-normal text-gray-300 mb-2">
                      Enter the 6-digit code from your app
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      placeholder="000000"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-center text-2xl tracking-widest font-light tabular-nums placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                    />
                  </div>
                  <button
                    onClick={handleVerifyAuthenticator}
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <p className="border-l border-green-400/60 pl-4 text-[13px] text-green-400 font-light leading-relaxed">
                    Authenticator app successfully configured!
                  </p>
                  <p className="text-[14px] text-gray-300 font-light leading-relaxed">
                    Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                  </p>
                  <div className="grid grid-cols-2 gap-px bg-white/[0.08] border border-white/[0.08] rounded-lg overflow-hidden">
                    {backupCodes.map((code, index) => (
                      <code key={index} className="bg-black px-3 py-2.5 text-center text-white font-mono text-[13px]">
                        {code}
                      </code>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadBackupCodes}
                      className="flex-1 px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Download
                    </button>
                    <button
                      onClick={handleCopyBackupCodes}
                      className="flex-1 px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Copy
                    </button>
                  </div>
                  {!savedBackupCodes && (
                    <p className="border-l border-yellow-400/60 pl-4 text-[13px] text-yellow-400 font-light leading-relaxed">
                      Please save your backup codes before continuing
                    </p>
                  )}
                  <button
                    onClick={handleComplete}
                    disabled={!savedBackupCodes}
                    className="w-full px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Done
                  </button>
                </div>
              )}
            </>
          )}

          {/* Email 2FA Setup */}
          {method === 'email' && (
            <>
              {step === 1 && (
                <div className="space-y-6">
                  <p className="text-[14px] text-gray-300 font-light leading-relaxed">
                    When you sign in, we'll send a verification code to your email address.
                  </p>
                  <p className="border-l border-white/[0.15] pl-4 text-[13px] text-gray-400 font-light leading-relaxed">
                    Make sure you have access to your email before enabling this feature.
                  </p>
                  <button
                    onClick={handleSetupEmailFactor}
                    disabled={loading}
                    className="w-full px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enabling...' : 'Enable Email 2FA'}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <p className="border-l border-green-400/60 pl-4 text-[13px] text-green-400 font-light leading-relaxed">
                    Email 2FA successfully enabled!
                  </p>
                  <p className="text-[14px] text-gray-300 font-light leading-relaxed">
                    Save these backup codes in a secure location. You can use them to access your account if you don't have access to your email.
                  </p>
                  <div className="grid grid-cols-2 gap-px bg-white/[0.08] border border-white/[0.08] rounded-lg overflow-hidden">
                    {backupCodes.map((code, index) => (
                      <code key={index} className="bg-black px-3 py-2.5 text-center text-white font-mono text-[13px]">
                        {code}
                      </code>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadBackupCodes}
                      className="flex-1 px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Download
                    </button>
                    <button
                      onClick={handleCopyBackupCodes}
                      className="flex-1 px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Copy
                    </button>
                  </div>
                  {!savedBackupCodes && (
                    <p className="border-l border-yellow-400/60 pl-4 text-[13px] text-yellow-400 font-light leading-relaxed">
                      Please save your backup codes before continuing
                    </p>
                  )}
                  <button
                    onClick={handleComplete}
                    disabled={!savedBackupCodes}
                    className="w-full px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Done
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
