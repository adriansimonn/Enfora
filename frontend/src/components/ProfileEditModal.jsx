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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08] flex-shrink-0">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">Edit Profile</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 -mr-1 text-gray-500 hover:text-white transition-colors duration-200 disabled:opacity-40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Profile Picture */}
          <div>
            <label className="block text-[13px] font-normal text-gray-300 mb-3">Profile Picture</label>
            <div className="flex items-center gap-6">
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover border border-white/[0.08]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center border border-white/[0.08]">
                  <span className="text-2xl font-light text-gray-300">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex flex-col items-start gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                  >
                    Upload Photo
                  </button>
                  {(profilePicturePreview || profile.profilePictureUrl) && (
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      className="text-sm font-light text-red-400 hover:text-red-300 transition-colors duration-200"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                <p className="text-[12px] text-gray-500 font-light">Max size: 5MB. Formats: JPEG, PNG, WebP</p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-[13px] font-normal text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              pattern="[a-zA-Z0-9_-]{3,30}"
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
              placeholder="exampleusername123"
            />
            <p className="mt-2 text-[12px] text-gray-500 font-light">3-30 characters: letters, numbers, hyphens, underscores</p>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-[13px] font-normal text-gray-300 mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200"
              placeholder="Your Name"
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-[13px] font-normal text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={250}
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[15px] text-white font-light placeholder-gray-600 focus:outline-none focus:border-white/[0.25] transition-colors duration-200 resize-none"
              placeholder="Tell people about yourself..."
            />
            <p className={`mt-2 text-[12px] font-light tabular-nums ${bioCharactersRemaining < 20 ? 'text-yellow-400' : 'text-gray-500'}`}>
              {bioCharactersRemaining} characters remaining
            </p>
          </div>

          {error && (
            <p className="border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light leading-relaxed">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-white/[0.08] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
