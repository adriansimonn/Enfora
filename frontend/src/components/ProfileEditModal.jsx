import { useState, useEffect, useRef } from 'react'
import { updateProfile, uploadProfilePicture, deleteProfilePicture } from '../services/profile'
import { useAuth } from '../context/AuthContext'

export default function ProfileEditModal({ profile, onClose, onUpdate }) {
  const { user } = useAuth()
  const [username, setUsername] = useState(profile.username)
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio || '')
  const [profilePictureFile, setProfilePictureFile] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(profile.profilePictureUrl || null)
  const [removeProfilePicture, setRemoveProfilePicture] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [loading, onClose])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }

      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are allowed')
        return
      }

      setProfilePictureFile(file)
      setProfilePicturePreview(URL.createObjectURL(file))
      setRemoveProfilePicture(false)
      setError('')
    }
  }

  const handleRemoveProfilePicture = () => {
    setProfilePictureFile(null)
    setProfilePicturePreview(null)
    setRemoveProfilePicture(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate bio length
      if (bio.length > 250) {
        throw new Error('Bio must be 250 characters or less')
      }

      // Update profile information
      const updates = {}
      if (displayName !== profile.displayName) updates.displayName = displayName
      if (bio !== profile.bio) updates.bio = bio
      if (username !== profile.username) updates.username = username

      let updatedProfile = profile

      if (Object.keys(updates).length > 0) {
        updatedProfile = await updateProfile(profile.username, updates)
      }

      // Handle profile picture upload
      if (profilePictureFile) {
        updatedProfile = await uploadProfilePicture(updatedProfile.username, profilePictureFile)
      } else if (removeProfilePicture && profile.profilePictureUrl) {
        updatedProfile = await deleteProfilePicture(updatedProfile.username)
      }

      onUpdate(updatedProfile)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const bioCharactersRemaining = 250 - bio.length

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Profile Picture</label>
            <div className="flex items-center gap-6">
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-zinc-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-zinc-700">
                  <span className="text-3xl font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm"
                >
                  Upload Photo
                </button>
                {(profilePicturePreview || profile.profilePictureUrl) && (
                  <button
                    type="button"
                    onClick={handleRemoveProfilePicture}
                    className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors text-sm"
                  >
                    Remove Photo
                  </button>
                )}
                <p className="text-xs text-gray-400">Max size: 5MB. Formats: JPEG, PNG, WebP</p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              pattern="[a-zA-Z0-9_-]{3,30}"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="exampleusername123"
            />
            <p className="mt-1 text-xs text-gray-400">3-30 characters: letters, numbers, hyphens, underscores</p>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-white mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="Your Name"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-white mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={250}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
              placeholder="Tell people about yourself..."
            />
            <p className={`mt-1 text-xs ${bioCharactersRemaining < 20 ? 'text-yellow-400' : 'text-gray-400'}`}>
              {bioCharactersRemaining} characters remaining
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-white hover:bg-gray-100 text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
