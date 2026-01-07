import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'
import { updateProfile } from '../services/profile'

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
    authenticatorEnabled: false,
    emailEnabled: false
  })

  useEffect(() => {
    if (user) {
      setAccountData({
        email: user.email || '',
        displayName: user.displayName || '',
        username: user.username || '',
        bio: user.bio || ''
      })
    }
  }, [user])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleAccountUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile({
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
      // TODO: Implement password change API
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
      // TODO: Implement notification settings API
      showMessage('success', 'Notification preferences updated successfully')
    } catch (error) {
      showMessage('error', error.message || 'Failed to update notification preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleEnable2FA = async (method) => {
    setLoading(true)
    try {
      // TODO: Implement 2FA setup API
      if (method === 'authenticator') {
        showMessage('success', 'Authenticator app 2FA will be implemented soon')
      } else {
        showMessage('success', 'Email-based 2FA will be implemented soon')
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to enable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable2FA = async (method) => {
    setLoading(true)
    try {
      // TODO: Implement 2FA disable API
      if (method === 'authenticator') {
        setTwoFactorSettings({ ...twoFactorSettings, authenticatorEnabled: false })
        showMessage('success', 'Authenticator app 2FA disabled')
      } else {
        setTwoFactorSettings({ ...twoFactorSettings, emailEnabled: false })
        showMessage('success', 'Email-based 2FA disabled')
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.'
    )

    if (!confirmed) return

    const doubleConfirm = window.confirm(
      'This is your final warning. Are you absolutely sure you want to delete your account?'
    )

    if (!doubleConfirm) return

    setLoading(true)
    try {
      // TODO: Implement account deletion API
      await logout()
      navigate('/')
      showMessage('success', 'Account deleted successfully')
    } catch (error) {
      showMessage('error', error.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
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
                      {/* Authenticator App 2FA */}
                      <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-base font-normal text-white mb-2">Authenticator App</h4>
                            <p className="text-sm text-gray-400 font-light mb-4">
                              Use an authenticator app like Google Authenticator or Authy to generate verification codes.
                            </p>
                            {twoFactorSettings.authenticatorEnabled ? (
                              <div className="flex items-center gap-2 text-sm text-green-400 font-light">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Enabled
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-gray-500 font-light">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Not enabled
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => twoFactorSettings.authenticatorEnabled ? handleDisable2FA('authenticator') : handleEnable2FA('authenticator')}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg transition-all duration-200 font-normal ${
                              twoFactorSettings.authenticatorEnabled
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                : 'bg-white text-black hover:bg-gray-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {twoFactorSettings.authenticatorEnabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>

                      {/* Email 2FA */}
                      <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-base font-normal text-white mb-2">Email Verification</h4>
                            <p className="text-sm text-gray-400 font-light mb-4">
                              Receive verification codes via email when signing in from a new device.
                            </p>
                            {twoFactorSettings.emailEnabled ? (
                              <div className="flex items-center gap-2 text-sm text-green-400 font-light">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Enabled
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-gray-500 font-light">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Not enabled
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => twoFactorSettings.emailEnabled ? handleDisable2FA('email') : handleEnable2FA('email')}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg transition-all duration-200 font-normal ${
                              twoFactorSettings.emailEnabled
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                : 'bg-white text-black hover:bg-gray-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {twoFactorSettings.emailEnabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>
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
    </div>
  )
}
