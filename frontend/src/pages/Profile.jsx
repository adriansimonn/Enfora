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
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="flex items-center justify-center py-16">
          <div className="text-gray-400 font-light">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <h1 className="text-3xl font-light text-white mb-4 tracking-[-0.01em]">Profile Not Found</h1>
            <p className="text-gray-400 font-light">{error || 'This profile does not exist.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white/[0.015] backdrop-blur border border-white/[0.06] rounded-2xl p-9 mb-6">
          <div className="flex items-start gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profile.profilePictureUrl ? (
                <img
                  src={profile.profilePictureUrl}
                  alt={profile.displayName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/[0.08]"
                  loading="lazy"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white/[0.08]">
                  <span className="text-4xl font-light text-white">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-grow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-light text-white mb-2 tracking-[-0.01em]">{profile.displayName}</h1>
                  <p className="text-gray-400 text-lg font-light">@{profile.username}</p>
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-lg transition-all duration-200 border border-white/[0.08] hover:border-white/[0.12] font-normal"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {profile.bio && (
                <p className="text-gray-300 mt-4 whitespace-pre-wrap font-light">{profile.bio}</p>
              )}

              <div className="mt-4 text-sm text-gray-500 font-light">
                Member since {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="bg-white/[0.015] backdrop-blur border border-white/[0.06] rounded-2xl p-9">
          <h2 className="text-2xl font-light text-white mb-6 tracking-[-0.01em]">Stats</h2>
          <Analytics
            userId={profile.userId}
            onShowReliabilityModal={(score) => {
              setReliabilityScore(score)
              setShowReliabilityModal(true)
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

// ReliabilityScoreModal Component
function ReliabilityScoreModal({ score, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const getTierInfo = (score) => {
    if (score >= 3000) return { name: "Platinum", range: "3000+", color: "from-purple-400 via-pink-400 to-purple-400" };
    if (score >= 1500) return { name: "Elite", range: "1500-3000", color: "from-blue-400 to-blue-500" };
    if (score >= 600) return { name: "Reliable", range: "600-1500", color: "from-green-400 to-green-500" };
    if (score >= 200) return { name: "Building Discipline", range: "200-600", color: "from-yellow-400 to-yellow-500" };
    return { name: "Inconsistent or Beginner", range: "<200", color: "from-red-400 to-red-500" };
  };

  const getReliabilityScoreColor = (score) => {
    // Color definitions (RGB values)
    const colors = {
      red: { r: 248, g: 113, b: 113 },
      orange: { r: 251, g: 146, b: 60 },
      yellow: { r: 250, g: 204, b: 21 },
      green: { r: 74, g: 222, b: 128 },
      blue: { r: 96, g: 165, b: 250 },
    };

    const interpolateColor = (value, min, mid, max, colorMin, colorMid, colorMax) => {
      const clampedValue = Math.max(min, Math.min(max, value));
      let t, color1, color2;

      if (clampedValue <= mid) {
        t = (clampedValue - min) / (mid - min);
        color1 = colorMin;
        color2 = colorMid;
      } else {
        t = (clampedValue - mid) / (max - mid);
        color1 = colorMid;
        color2 = colorMax;
      }

      const r = Math.round(color1.r + (color2.r - color1.r) * t);
      const g = Math.round(color1.g + (color2.g - color1.g) * t);
      const b = Math.round(color1.b + (color2.b - color1.b) * t);

      return `rgb(${r}, ${g}, ${b})`;
    };

    if (score >= 3000) return null;
    if (score >= 2000) return 'rgb(96, 165, 250)';

    if (score < 1000) {
      if (score <= 300) {
        return interpolateColor(score, 0, 150, 300, colors.red, colors.red, colors.orange);
      } else if (score <= 600) {
        return interpolateColor(score, 300, 450, 600, colors.orange, colors.orange, colors.yellow);
      } else {
        return interpolateColor(score, 600, 800, 1000, colors.yellow, colors.yellow, colors.green);
      }
    }

    return interpolateColor(score, 1000, 1500, 2000, colors.green, colors.green, colors.blue);
  };

  const currentTier = getTierInfo(score);

  const tiers = [
    { name: "Inconsistent or Beginner", range: "<200", color: "from-red-400 to-red-500", isCurrent: score < 200 },
    { name: "Building Discipline", range: "200-600", color: "from-yellow-400 to-yellow-500", isCurrent: score >= 200 && score < 600 },
    { name: "Reliable", range: "600-1500", color: "from-green-400 to-green-500", isCurrent: score >= 600 && score < 1500 },
    { name: "Elite", range: "1500-3000", color: "from-blue-400 to-blue-500", isCurrent: score >= 1500 && score < 3000 },
    { name: "Platinum", range: "3000+", color: "from-purple-400 via-white-400 to-blue-400", isCurrent: score >= 3000 },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.06] rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06] flex-shrink-0">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">Reliability Score</h2>
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Description */}
          <div>
            <p className="text-sm text-gray-300 mb-3 font-light">
              The Reliability Score is Enfora's flagship metric that measures your consistency and discipline
              in creating and completing tasks.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-400 font-light">Current score:</span>
              <span
                className={`text-2xl font-light ${score >= 3000 ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent' : ''}`}
                style={score >= 3000 ? {} : { color: getReliabilityScoreColor(score) }}
              >
                {score}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${currentTier.color} text-white`}>
                {currentTier.name}
              </span>
            </div>
          </div>

          {/* Tiers */}
          <div>
            <h3 className="text-base font-normal text-white mb-3">Score Tiers</h3>
            <div className="space-y-2.5">
              {tiers.map((tier, index) => (
                <div
                  key={index}
                  className={`border rounded-xl p-4 transition-all ${
                    tier.isCurrent
                      ? 'border-white/[0.12] bg-white/[0.04]'
                      : 'border-white/[0.06] bg-white/[0.015]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        tier.name === "Platinum"
                          ? 'platinum-badge-gradient border-2 border-transparent'
                          : `bg-gradient-to-r ${tier.color}`
                      }`}>
                        {tier.isCurrent && (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm ${
                            tier.name === "Platinum"
                              ? 'platinum-text-gradient font-black'
                              : 'text-white font-normal'
                          }`}>{tier.name}</h4>
                          {tier.isCurrent && (
                            <span className="text-xs text-green-400 font-normal">Current</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-light">{tier.range} points</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
