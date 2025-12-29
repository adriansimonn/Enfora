import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'
import Analytics from '../components/Analytics'
import ProfileEditModal from '../components/ProfileEditModal'
import { getProfile } from '../services/profile'

export default function Profile() {
  const { username } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const isOwnProfile = user && user.username === username

  useEffect(() => {
    document.title = `${username} | Enfora`
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const profileData = await getProfile(username)
      setProfile(profileData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900">
        <Navigation />
        <div className="flex items-center justify-center py-16">
          <div className="text-gray-400">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900">
        <Navigation />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
            <p className="text-gray-400">{error || 'This profile does not exist.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900">
      <Navigation />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profile.profilePictureUrl ? (
                <img
                  src={profile.profilePictureUrl}
                  alt={profile.displayName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-zinc-700">
                  <span className="text-4xl font-bold text-white">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-grow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{profile.displayName}</h1>
                  <p className="text-gray-400 text-lg">@{profile.username}</p>
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {profile.bio && (
                <p className="text-gray-300 mt-4 whitespace-pre-wrap">{profile.bio}</p>
              )}

              <div className="mt-4 text-sm text-gray-500">
                Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Stats</h2>
          <Analytics userId={profile.userId} />
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <ProfileEditModal
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  )
}
