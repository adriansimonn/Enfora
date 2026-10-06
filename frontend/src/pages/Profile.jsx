import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navigation from '../components/Navigation'
import Analytics from '../components/Analytics'
import ProfileEditModal from '../components/ProfileEditModal'
import UserTag from '../components/UserTag'
import ReliabilityScoreModal from '../components/ReliabilityScoreModal'
import { getProfile } from '../services/profile'
import { mergeTagsWithTier } from '../utils/tagUtils'

export default function Profile() {
  const { username } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showReliabilityModal, setShowReliabilityModal] = useState(false)
  const [reliabilityScore, setReliabilityScore] = useState(0)

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
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
        <Navigation />
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-28">
          <p className="text-[15px] text-gray-500 font-light">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
        <Navigation />
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-28">
          <h1 className="text-4xl font-light text-white mb-3 tracking-[-0.02em] leading-[1.1]">Profile Not Found</h1>
          <p className="text-[15px] text-gray-400 font-light">{error || 'This profile does not exist.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Navigation />

      <div className="max-w-5xl mx-auto px-6 pt-16 pb-28">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start gap-8">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={profile.displayName}
                className="w-24 h-24 rounded-full object-cover border border-white/[0.08]"
                loading="lazy"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/[0.04] flex items-center justify-center border border-white/[0.08]">
                <span className="text-3xl font-light text-gray-300">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="min-w-0">
                <h1 className="text-4xl font-light text-white mb-2 tracking-[-0.02em] leading-[1.1]">{profile.displayName}</h1>
                <p className="text-[15px] text-gray-400 font-light">@{profile.username}</p>

                {/* User Tags */}
                {(() => {
                  const displayTags = mergeTagsWithTier(profile.tags, reliabilityScore);
                  return displayTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {displayTags.map((tag, index) => (
                        <UserTag key={index} tag={tag} />
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="self-start px-5 py-2.5 bg-white/[0.03] text-white text-sm font-normal rounded-lg border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {profile.bio && (
              <p className="text-[15px] text-gray-300 mt-6 max-w-2xl leading-relaxed whitespace-pre-wrap font-light">{profile.bio}</p>
            )}

            <p className="mt-6 text-[13px] text-gray-500 font-light">
              Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="mt-24">
          <h2 className="text-2xl font-light text-white mb-10 tracking-[-0.01em]">Stats</h2>
          <Analytics
            userId={profile.userId}
            onShowReliabilityModal={(score) => {
              setReliabilityScore(score)
              setShowReliabilityModal(true)
            }}
            onReliabilityScoreLoad={(score) => {
              setReliabilityScore(score)
            }}
          />
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

      {/* Reliability Score Modal - Rendered at root level for proper centering */}
      {showReliabilityModal && (
        <ReliabilityScoreModal
          score={reliabilityScore}
          onClose={() => setShowReliabilityModal(false)}
        />
      )}
    </div>
  )
}
