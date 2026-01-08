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
    { id: 'account', label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' }
  ]

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-white mb-2 tracking-[-0.01em]">Settings</h1>
          <p className="text-gray-400 font-light">Manage your account settings and preferences</p>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <p className="font-light">{message.text}</p>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white/[0.015] backdrop-blur border border-white/[0.06] rounded-2xl p-2 sticky top-6">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-white/[0.08] text-white'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                  </svg>
                  <span className="font-normal">{section.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white/[0.015] backdrop-blur border border-white/[0.06] rounded-2xl p-8">

              {/* Account Section */}
              {activeSection === 'account' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-light text-white mb-6 tracking-[-0.01em]">Account Information</h2>
                    <form onSubmit={handleAccountUpdate} className="space-y-6">
                      <div>
                        <label className="block text-sm font-normal text-gray-300 mb-2">Email</label>
                        <input
                          type="email"
                          value={accountData.email}
                          disabled
                          className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-gray-500 cursor-not-allowed font-light"
                        />
                        <p className="mt-2 text-xs text-gray-500 font-light">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-sm font-normal text-gray-300 mb-2">Username</label>
                        <input
                          type="text"
                          value={accountData.username}
                          onChange={(e) => setAccountData({ ...accountData, username: e.target.value })}
                          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12] transition-all font-light"
                          placeholder="Your username"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-normal text-gray-300 mb-2">Display Name</label>
                        <input
                          type="text"
                          value={accountData.displayName}
                          onChange={(e) => setAccountData({ ...accountData, displayName: e.target.value })}
                          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12] transition-all font-light"
                          placeholder="Your display name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-normal text-gray-300 mb-2">Bio</label>
                        <textarea
                          value={accountData.bio}
                          onChange={(e) => setAccountData({ ...accountData, bio: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12] transition-all resize-none font-light"
                          placeholder="Tell us about yourself"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </div>

                  {/* Delete Account Section */}
                  <div className="border-t border-white/[0.06] pt-8">
                    <h3 className="text-xl font-light text-white mb-4 tracking-[-0.01em]">Delete Account</h3>
                    <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-6">
                      <p className="text-sm text-gray-400 font-light mb-4">
                        Once you delete your account, there is no going back. All your data will be permanently removed.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div className="space-y-8">
                  {/* Password Change */}
                  <div>
                    <h2 className="text-2xl font-light text-white mb-6 tracking-[-0.01em]">Change Password</h2>
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div>
                        <label className="block text-sm font-normal text-gray-300 mb-2">Current Password</label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12] transition-all font-light"
                          placeholder="Enter current password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-normal text-gray-300 mb-2">New Password</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12] transition-all font-light"
                          placeholder="Enter new password"
                        />
                        <p className="mt-2 text-xs text-gray-500 font-light">Must be at least 8 characters long</p>
                      </div>

                      <div>
                        <label className="block text-sm font-normal text-gray-300 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12] transition-all font-light"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </button>
                    </form>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border-t border-white/[0.06] pt-8">
                    <h3 className="text-xl font-light text-white mb-4 tracking-[-0.01em]">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-400 font-light mb-6">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>

                    <div className="space-y-4">
                      {!twoFactorSettings.twoFactorEnabled ? (
                        <>
                          {/* Authenticator App 2FA */}
                          <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-base font-normal text-white mb-2">Authenticator App</h4>
                                <p className="text-sm text-gray-400 font-light mb-4">
                                  Use an authenticator app like Google Authenticator or Authy to generate verification codes.
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-light">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Not enabled
                                </div>
                              </div>
                              <button
                                onClick={() => handleEnable2FA('authenticator')}
                                disabled={loading}
                                className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Enable
                              </button>
                            </div>
                          </div>

                          {/* Email 2FA */}
                          <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-base font-normal text-white mb-2">Email Verification</h4>
                                <p className="text-sm text-gray-400 font-light mb-4">
                                  Receive verification codes via email when signing in.
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-light">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Not enabled
                                </div>
                              </div>
                              <button
                                onClick={() => handleEnable2FA('email')}
                                disabled={loading}
                                className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Enable
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="border border-green-500/20 bg-green-500/5 rounded-xl p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h4 className="text-base font-normal text-white">
                                  {twoFactorSettings.twoFactorMethod === 'authenticator' ? 'Authenticator App' : 'Email Verification'}
                                </h4>
                              </div>
                              <p className="text-sm text-green-400 font-light mb-4">
                                Two-factor authentication is currently enabled
                              </p>
                              <p className="text-sm text-gray-400 font-light">
                                Your account is protected with {twoFactorSettings.twoFactorMethod === 'authenticator' ? 'authenticator app verification' : 'email verification codes'}.
                                {twoFactorSettings.hasBackupCodes && ` You have ${twoFactorSettings.backupCodesCount} backup codes remaining.`}
                              </p>
                            </div>
                            <button
                              onClick={handleDisable2FA}
                              disabled={loading}
                              className="px-4 py-2 rounded-lg transition-all duration-200 font-normal bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Disable
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-light text-white mb-6 tracking-[-0.01em]">Notification Preferences</h2>
                  <form onSubmit={handleNotificationUpdate} className="space-y-6">
                    <div className="space-y-4">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive email notifications for important updates' },
                        { key: 'taskReminders', label: 'Task Reminders', description: 'Get reminders for upcoming task deadlines' },
                        { key: 'achievementAlerts', label: 'Achievement Alerts', description: 'Be notified when you earn new achievements' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                          <div className="flex-1">
                            <label className="block text-sm font-normal text-gray-300 mb-1">{item.label}</label>
                            <p className="text-xs text-gray-500 font-light">{item.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notificationSettings[item.key]}
                              onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </form>
                </div>
              )}

            </div>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h2 className="text-xl font-light text-white tracking-[-0.01em]">Disable 2FA</h2>
              <button
                onClick={() => {
                  setShowDisableConfirm(false)
                  setDisablePassword('')
                }}
                className="text-gray-400 hover:text-white transition-all duration-200 p-1 hover:bg-white/[0.06] rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 font-light text-sm">
                  This will make your account less secure. Enter your password to confirm.
                </p>
              </div>
              <div>
                <label className="block text-sm font-normal text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-white/[0.12] transition-all font-light"
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDisableConfirm(false)
                    setDisablePassword('')
                  }}
                  className="flex-1 px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-lg transition-all duration-200 border border-white/[0.08] font-normal"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDisable2FA}
                  disabled={loading || !disablePassword}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h2 className="text-xl font-light text-white tracking-[-0.01em]">Delete Account</h2>
              <button
                onClick={handleCancelDeletion}
                className="text-gray-400 hover:text-white transition-all duration-200 p-1 hover:bg-white/[0.06] rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {deletionStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 font-light text-sm mb-2">
                      <strong>Warning:</strong> This action cannot be undone!
                    </p>
                    <ul className="text-red-400 font-light text-sm space-y-1 list-disc list-inside">
                      <li>All your data will be permanently deleted</li>
                      <li>Your tasks and progress will be lost</li>
                      <li>You cannot recover your account after deletion</li>
                    </ul>
                  </div>
                  <p className="text-gray-300 font-light text-sm">
                    To proceed, we'll send a verification code to your email address.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelDeletion}
                      className="flex-1 px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-lg transition-all duration-200 border border-white/[0.08] font-normal"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRequestDeletionCode}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 font-normal disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Continue'}
                    </button>
                  </div>
                </div>
              )}

              {deletionStep === 2 && (
                <div className="space-y-4">
                  <p className="text-gray-300 font-light text-sm">
                    We've sent a 6-digit verification code to <strong>{deletionEmail}</strong>
                  </p>
                  <div>
                    <label className="block text-sm font-normal text-gray-300 mb-2">Verification Code</label>
                    <input
                      type="text"
                      value={deletionCode}
                      onChange={(e) => setDeletionCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-center text-2xl tracking-widest font-light focus:outline-none focus:border-white/[0.12] transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 font-light">
                    The code will expire in 10 minutes
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelDeletion}
                      className="flex-1 px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-lg transition-all duration-200 border border-white/[0.08] font-normal"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerifyCode}
                      disabled={deletionCode.length !== 6}
                      className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Verify Code
                    </button>
                  </div>
                </div>
              )}

              {deletionStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 font-light text-sm">
                      <strong>Final Step:</strong> Type your username to confirm deletion
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-normal text-gray-300 mb-2">
                      Type <strong>{user?.username}</strong> to confirm
                    </label>
                    <input
                      type="text"
                      value={deletionUsername}
                      onChange={(e) => setDeletionUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white font-light focus:outline-none focus:border-white/[0.12] transition-all"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelDeletion}
                      className="flex-1 px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-lg transition-all duration-200 border border-white/[0.08] font-normal"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDeletion}
                      disabled={loading || deletionUsername !== user?.username}
                      className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 font-normal disabled:opacity-50 disabled:cursor-not-allowed"
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
