import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'
import { updateProfile } from '../services/profile'
import { changePassword, getNotificationSettings, updateNotificationSettings, requestAccountDeletion, confirmAccountDeletion } from '../services/settings'
import { get2FAStatus, disable2FA as disable2FAService } from '../services/twoFactor'
import TwoFactorSetupModal from '../components/TwoFactorSetupModal'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('account')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Account Settings State
  const [accountData, setAccountData] = useState({
    email: '',
    displayName: '',
    username: '',
    bio: ''
  })

  // Password Settings State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    taskReminders: true,
    achievementAlerts: true
  })

  // 2FA Settings State
  const [twoFactorSettings, setTwoFactorSettings] = useState({
    twoFactorEnabled: false,
    twoFactorMethod: null,
    hasBackupCodes: false,
    backupCodesCount: 0
  })
  const [show2FASetupModal, setShow2FASetupModal] = useState(false)
  const [setup2FAMethod, setSetup2FAMethod] = useState(null)
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)

  // Account Deletion Modal State
  const [showDeletionModal, setShowDeletionModal] = useState(false)
  const [deletionStep, setDeletionStep] = useState(1)
  const [deletionCode, setDeletionCode] = useState('')
  const [deletionUsername, setDeletionUsername] = useState('')
  const [deletionEmail, setDeletionEmail] = useState('')

  useEffect(() => {
    if (user) {
      setAccountData({
        email: user.email || '',
        displayName: user.displayName || '',
        username: user.username || '',
        bio: user.bio || ''
      })
    }
    loadNotificationSettings()
    load2FASettings()
  }, [user])

  const loadNotificationSettings = async () => {
    try {
      const settings = await getNotificationSettings()
      setNotificationSettings(settings)
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }

  const load2FASettings = async () => {
    try {
      const settings = await get2FAStatus()
      setTwoFactorSettings(settings)
    } catch (error) {
      console.error('Failed to load 2FA settings:', error)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleAccountUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(user.username, {
        displayName: accountData.displayName,
        username: accountData.username,
        bio: accountData.bio
      })
      showMessage('success', 'Account information updated successfully')
    } catch (error) {
      showMessage('error', error.message || 'Failed to update account information')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword)
      showMessage('success', 'Password changed successfully')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      showMessage('error', error.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateNotificationSettings(notificationSettings)
      showMessage('success', 'Notification preferences updated successfully')
    } catch (error) {
      showMessage('error', error.message || 'Failed to update notification preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleEnable2FA = async (method) => {
    setSetup2FAMethod(method)
    setShow2FASetupModal(true)
  }

  const handle2FASetupSuccess = async () => {
    await load2FASettings()
    showMessage('success', 'Two-factor authentication enabled successfully')
  }

  const handleDisable2FA = async () => {
    setShowDisableConfirm(true)
  }

  const handleConfirmDisable2FA = async () => {
    if (!disablePassword) {
      showMessage('error', 'Password is required')
      return
    }

    setLoading(true)
    try {
      await disable2FAService(disablePassword)
      await load2FASettings()
      setShowDisableConfirm(false)
      setDisablePassword('')
      showMessage('success', 'Two-factor authentication disabled')
    } catch (error) {
      showMessage('error', error.message || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = () => {
    setShowDeletionModal(true)
    setDeletionStep(1)
    setDeletionCode('')
    setDeletionUsername('')
    setDeletionEmail('')
  }

  const handleRequestDeletionCode = async () => {
    setLoading(true)
    try {
      const response = await requestAccountDeletion()
      setDeletionEmail(response.email)
      setDeletionStep(2)
      showMessage('success', `Verification code sent to ${response.email}`)
    } catch (error) {
      showMessage('error', error.message || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = () => {
    if (deletionCode.length !== 6) {
      showMessage('error', 'Please enter a 6-digit code')
      return
    }
    setDeletionStep(3)
  }

  const handleConfirmDeletion = async () => {
    if (!deletionUsername) {
      showMessage('error', 'Please enter your username')
      return
    }

    setLoading(true)
    try {
      await confirmAccountDeletion(deletionCode, deletionUsername)
      setShowDeletionModal(false)
      await logout()
      navigate('/')
      showMessage('success', 'Account deleted successfully')
    } catch (error) {
      showMessage('error', error.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelDeletion = () => {
    setShowDeletionModal(false)
    setDeletionStep(1)
    setDeletionCode('')
    setDeletionUsername('')
    setDeletionEmail('')
  }

  const sections = [
    { id: 'account', label: 'Account' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' }
  ]

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Navigation />

      <div className="max-w-5xl mx-auto px-6 pt-16 pb-28">
        {/* Header */}
        <div className="mb-14">
          <h1 className="text-4xl font-light text-white mb-3 tracking-[-0.02em] leading-[1.1]">Settings</h1>
          <p className="text-[15px] text-gray-400 font-light">Manage your account settings and preferences</p>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`mb-10 border-l pl-4 ${
            message.type === 'success'
              ? 'border-green-400/60 text-green-400'
              : 'border-red-400/60 text-red-400'
          }`}>
            <p className="text-[13px] font-light">{message.text}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-10 md:gap-16">
          {/* Sidebar Navigation */}
          <div className="md:w-44 flex-shrink-0">
            <nav className="flex md:flex-col gap-6 md:gap-0 border-b md:border-b-0 md:border-l border-white/[0.08] md:sticky md:top-6">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`-mb-px md:mb-0 md:-ml-px py-3 md:py-2 md:pl-4 text-left text-sm border-b md:border-b-0 md:border-l transition-colors duration-200 ${
                    activeSection === section.id
                      ? 'border-white text-white font-normal'
                      : 'border-transparent text-gray-500 hover:text-gray-300 font-light'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 max-w-2xl">

              {/* Account Section */}
              {activeSection === 'account' && (
                <div>
                  <div>
                    <h2 className="text-2xl font-light text-white mb-8 tracking-[-0.01em]">Account Information</h2>
                    <form onSubmit={handleAccountUpdate} className="space-y-6">
                      <div>
                        <label className="block text-[13px] font-normal text-gray-300 mb-2">Email</label>
                        <input
                          type="email"
                          value={accountData.email}
                          disabled
                          className="w-full px-4 py-2.5 bg-transparent border border-white/[0.06] rounded-lg text-[15px] text-gray-500 cursor-not-allowed font-light"
                        />
                        <p className="mt-2 text-[12px] text-gray-500 font-light">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-[13px] font-normal text-gray-300 mb-2">Username</label>
                        <input
                          type="text"
                          value={accountData.username}
                          onChange={(e) => setAccountData({ ...accountData, username: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                          placeholder="Your username"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-normal text-gray-300 mb-2">Display Name</label>
                        <input
                          type="text"
                          value={accountData.displayName}
                          onChange={(e) => setAccountData({ ...accountData, displayName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                          placeholder="Your display name"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-normal text-gray-300 mb-2">Bio</label>
                        <textarea
                          value={accountData.bio}
                          onChange={(e) => setAccountData({ ...accountData, bio: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200 resize-none"
                          placeholder="Tell us about yourself"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </div>

                  {/* Delete Account Section */}
                  <div className="mt-20 border-t border-white/[0.08] pt-10">
                    <h3 className="text-xl font-light text-white mb-2 tracking-[-0.01em]">Delete Account</h3>
                    <p className="text-[13px] text-gray-400 font-light leading-relaxed mb-6">
                      Once you delete your account, there is no going back. All your data will be permanently removed.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="px-6 py-2.5 text-red-400 text-sm font-normal rounded-lg border border-red-400/30 hover:bg-red-400/[0.06] hover:border-red-400/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div>
                  {/* Password Change */}
                  <div>
                    <h2 className="text-2xl font-light text-white mb-8 tracking-[-0.01em]">Change Password</h2>
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div>
                        <label className="block text-[13px] font-normal text-gray-300 mb-2">Current Password</label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                          placeholder="Enter current password"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-normal text-gray-300 mb-2">New Password</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                          placeholder="Enter new password"
                        />
                        <p className="mt-2 text-[12px] text-gray-500 font-light">Must be at least 8 characters long</p>
                      </div>

                      <div>
                        <label className="block text-[13px] font-normal text-gray-300 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </button>
                    </form>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="mt-20 border-t border-white/[0.08] pt-10">
                    <h3 className="text-xl font-light text-white mb-2 tracking-[-0.01em]">Two-Factor Authentication</h3>
                    <p className="text-[13px] text-gray-400 font-light leading-relaxed mb-8">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>

                    {!twoFactorSettings.twoFactorEnabled ? (
                      <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                        {/* Authenticator App 2FA */}
                        <div className="flex items-start justify-between gap-6 py-5">
                          <div className="flex-1">
                            <h4 className="text-[15px] font-normal text-white mb-1">Authenticator App</h4>
                            <p className="text-[13px] text-gray-400 font-light leading-relaxed mb-3">
                              Use an authenticator app like Google Authenticator or Authy to generate verification codes.
                            </p>
                            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-gray-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                              Not enabled
                            </span>
                          </div>
                          <button
                            onClick={() => handleEnable2FA('authenticator')}
                            disabled={loading}
                            className="px-4 py-2 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Enable
                          </button>
                        </div>

                        {/* Email 2FA */}
                        <div className="flex items-start justify-between gap-6 py-5">
                          <div className="flex-1">
                            <h4 className="text-[15px] font-normal text-white mb-1">Email Verification</h4>
                            <p className="text-[13px] text-gray-400 font-light leading-relaxed mb-3">
                              Receive verification codes via email when signing in.
                            </p>
                            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-gray-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                              Not enabled
                            </span>
                          </div>
                          <button
                            onClick={() => handleEnable2FA('email')}
                            disabled={loading}
                            className="px-4 py-2 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Enable
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-6 border-t border-white/[0.15] pt-5">
                        <div className="flex-1">
                          <h4 className="text-[15px] font-normal text-white mb-2">
                            {twoFactorSettings.twoFactorMethod === 'authenticator' ? 'Authenticator App' : 'Email Verification'}
                          </h4>
                          <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-green-400 mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            Two-factor authentication is currently enabled
                          </span>
                          <p className="text-[13px] text-gray-400 font-light leading-relaxed">
                            Your account is protected with {twoFactorSettings.twoFactorMethod === 'authenticator' ? 'authenticator app verification' : 'email verification codes'}.
                            {twoFactorSettings.hasBackupCodes && ` You have ${twoFactorSettings.backupCodesCount} backup codes remaining.`}
                          </p>
                        </div>
                        <button
                          onClick={handleDisable2FA}
                          disabled={loading}
                          className="px-4 py-2 text-red-400 text-sm font-normal rounded-lg border border-red-400/30 hover:bg-red-400/[0.06] hover:border-red-400/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Disable
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-light text-white mb-8 tracking-[-0.01em]">Notification Preferences</h2>
                  <form onSubmit={handleNotificationUpdate}>
                    <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive email notifications for important updates' },
                        { key: 'taskReminders', label: 'Task Reminders', description: 'Get reminders for upcoming task deadlines' },
                        { key: 'achievementAlerts', label: 'Achievement Alerts', description: 'Be notified when you earn new achievements' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between gap-6 py-5">
                          <div className="flex-1">
                            <label className="block text-[15px] font-normal text-white mb-1">{item.label}</label>
                            <p className="text-[13px] text-gray-400 font-light">{item.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings[item.key]}
                              onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-6 bg-white/[0.1] rounded-full peer transition-colors duration-200 peer-checked:bg-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:duration-200 peer-checked:after:translate-x-4 peer-checked:after:bg-black"></div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-8 px-6 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </form>
                </div>
              )}

          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetupModal && (
        <TwoFactorSetupModal
          method={setup2FAMethod}
          onClose={() => {
            setShow2FASetupModal(false)
            setSetup2FAMethod(null)
          }}
          onSuccess={handle2FASetupSuccess}
        />
      )}

      {/* Disable 2FA Confirmation Modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/[0.08] rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
              <h2 className="text-xl font-light text-white tracking-[-0.01em]">Disable 2FA</h2>
              <button
                onClick={() => {
                  setShowDisableConfirm(false)
                  setDisablePassword('')
                }}
                className="p-1 -mr-1 text-gray-500 hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light leading-relaxed">
                This will make your account less secure. Enter your password to confirm.
              </p>
              <div>
                <label className="block text-[13px] font-normal text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDisableConfirm(false)
                    setDisablePassword('')
                  }}
                  className="flex-1 px-4 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDisable2FA}
                  disabled={loading || !disablePassword}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal */}
      {showDeletionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/[0.08] rounded-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
              <h2 className="text-xl font-light text-white tracking-[-0.01em]">Delete Account</h2>
              <button
                onClick={handleCancelDeletion}
                className="p-1 -mr-1 text-gray-500 hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {deletionStep === 1 && (
                <div className="space-y-6">
                  <div className="border-l border-red-400/60 pl-4">
                    <p className="text-[13px] text-red-400 font-light mb-2">
                      <span className="font-normal">Warning:</span> This action cannot be undone!
                    </p>
                    <ul className="text-[13px] text-gray-400 font-light space-y-1 list-disc pl-4 marker:text-gray-600">
                      <li>All your data will be permanently deleted</li>
                      <li>Your tasks and progress will be lost</li>
                      <li>You cannot recover your account after deletion</li>
                    </ul>
                  </div>
                  <p className="text-[14px] text-gray-300 font-light leading-relaxed">
                    To proceed, we'll send a verification code to your email address.
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCancelDeletion}
                      className="flex-1 px-4 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRequestDeletionCode}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Continue'}
                    </button>
                  </div>
                </div>
              )}

              {deletionStep === 2 && (
                <div className="space-y-6">
                  <p className="text-[14px] text-gray-300 font-light leading-relaxed">
                    We've sent a 6-digit verification code to <span className="text-white font-normal">{deletionEmail}</span>
                  </p>
                  <div>
                    <label className="block text-[13px] font-normal text-gray-300 mb-2">Verification Code</label>
                    <input
                      type="text"
                      value={deletionCode}
                      onChange={(e) => setDeletionCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-center text-2xl tracking-widest font-light tabular-nums placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                    />
                    <p className="mt-2 text-[12px] text-gray-500 font-light">
                      The code will expire in 10 minutes
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCancelDeletion}
                      className="flex-1 px-4 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerifyCode}
                      disabled={deletionCode.length !== 6}
                      className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Verify Code
                    </button>
                  </div>
                </div>
              )}

              {deletionStep === 3 && (
                <div className="space-y-6">
                  <p className="border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light">
                    <span className="font-normal">Final Step:</span> Type your username to confirm deletion
                  </p>
                  <div>
                    <label className="block text-[13px] font-normal text-gray-300 mb-2">
                      Type <span className="text-white">{user?.username}</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deletionUsername}
                      onChange={(e) => setDeletionUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCancelDeletion}
                      className="flex-1 px-4 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDeletion}
                      disabled={loading || deletionUsername !== user?.username}
                      className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
