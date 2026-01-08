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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06] sticky top-0 bg-black z-10">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">
            {method === 'authenticator' ? 'Setup Authenticator App' : 'Setup Email 2FA'}
          </h2>
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
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 rounded-xl border bg-red-500/10 border-red-500/20 text-red-400">
              <p className="font-light text-sm">{error}</p>
            </div>
          )}

          {/* Authenticator App Setup */}
          {method === 'authenticator' && (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-gray-300 font-light text-sm">
                    To set up two-factor authentication with an authenticator app:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300 font-light text-sm">
                    <li>Download an authenticator app like Google Authenticator, Authy, or 1Password</li>
                    <li>Click Continue to get your QR code</li>
                    <li>Scan the QR code with your authenticator app</li>
                    <li>Enter the verification code from your app</li>
                  </ol>
                  <button
                    onClick={handleStartAuthenticatorSetup}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    {loading ? 'Loading...' : 'Continue'}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-gray-300 font-light text-sm mb-4">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="flex justify-center p-4 bg-white rounded-xl">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-light mb-2">Or enter this code manually:</p>
                    <code className="text-white font-mono text-sm break-all">{secret}</code>
                  </div>
                  <div>
                    <label className="block text-sm font-normal text-gray-300 mb-2">
                      Enter the 6-digit code from your app
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      placeholder="000000"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-center text-2xl tracking-widest font-light focus:outline-none focus:border-white/[0.12] transition-all"
                    />
                  </div>
                  <button
                    onClick={handleVerifyAuthenticator}
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <p className="text-green-400 font-light text-sm">
                      Authenticator app successfully configured!
                    </p>
                  </div>
                  <p className="text-gray-300 font-light text-sm">
                    Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                  </p>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <code key={index} className="text-white font-mono text-sm p-2 bg-white/[0.03] rounded">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadBackupCodes}
                      className="flex-1 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-lg transition-all duration-200 border border-white/[0.08] font-normal"
                    >
                      Download
                    </button>
                    <button
                      onClick={handleCopyBackupCodes}
                      className="flex-1 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-lg transition-all duration-200 border border-white/[0.08] font-normal"
                    >
                      Copy
                    </button>
                  </div>
                  {!savedBackupCodes && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                      <p className="text-yellow-400 font-light text-sm">
                        Please save your backup codes before continuing
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleComplete}
                    disabled={!savedBackupCodes}
                    className="w-full px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="space-y-4">
                  <p className="text-gray-300 font-light text-sm">
                    When you sign in, we'll send a verification code to your email address.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-400 font-light text-sm">
                      Make sure you have access to your email before enabling this feature.
                    </p>
                  </div>
                  <button
                    onClick={handleSetupEmailFactor}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enabling...' : 'Enable Email 2FA'}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <p className="text-green-400 font-light text-sm">
                      Email 2FA successfully enabled!
                    </p>
                  </div>
                  <p className="text-gray-300 font-light text-sm">
                    Save these backup codes in a secure location. You can use them to access your account if you don't have access to your email.
                  </p>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <code key={index} className="text-white font-mono text-sm p-2 bg-white/[0.03] rounded">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadBackupCodes}
                      className="flex-1 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-lg transition-all duration-200 border border-white/[0.08] font-normal"
                    >
                      Download
                    </button>
                    <button
                      onClick={handleCopyBackupCodes}
                      className="flex-1 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-lg transition-all duration-200 border border-white/[0.08] font-normal"
                    >
                      Copy
                    </button>
                  </div>
                  {!savedBackupCodes && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                      <p className="text-yellow-400 font-light text-sm">
                        Please save your backup codes before continuing
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleComplete}
                    disabled={!savedBackupCodes}
                    className="w-full px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
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
