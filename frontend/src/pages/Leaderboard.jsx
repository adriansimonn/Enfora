import { useState, useEffect } from 'react';
import { fetchLeaderboardTop100, fetchMyRank } from '../services/api';
import Navigation from '../components/Navigation';
import UserTag from '../components/UserTag';
import { useAuth } from '../context/AuthContext';
import { mergeTagsWithTier } from '../utils/tagUtils';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadLeaderboard();
  }, [user]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch top 100 (always public)
      const top100Data = await fetchLeaderboardTop100();
      setLeaderboard(top100Data);

      // Fetch authenticated user's rank if logged in
      if (user) {
        try {
          const rankData = await fetchMyRank();
          setMyRank(rankData);
        } catch (rankError) {
          setMyRank(null);
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Color interpolation for reliability scores (reuse Analytics.jsx logic)
  const getReliabilityScoreColor = (score) => {
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

    const colors = {
      red: { r: 248, g: 113, b: 113 },
      orange: { r: 251, g: 146, b: 60 },
      yellow: { r: 250, g: 204, b: 21 },
      green: { r: 74, g: 222, b: 128 },
      blue: { r: 96, g: 165, b: 250 },
    };

    if (score >= 3500) {
      return null; // Use gradient class
    }

    if (score >= 2000) {
      return 'rgb(96, 165, 250)'; // blue-400
    }

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

  const getRankDisplay = (rank, isMyRank) => {
    if (rank === 1) {
      return { number: '1', className: 'rank-gold-gradient font-normal' };
    }
    if (rank === 2) {
      return { number: '2', className: 'rank-silver-gradient font-normal' };
    }
    if (rank === 3) {
      return { number: '3', className: 'rank-bronze-gradient font-normal' };
    }
    return {
      number: `${rank}`,
      className: isMyRank ? 'text-white' : 'text-white/30 group-hover:text-white/70'
    };
  };

  const handleProfileClick = (username) => {
    window.location.href = `/profile/${username}`;
  };

  const LeaderboardRow = ({ entry, isMyRank = false }) => {
    const rankDisplay = getRankDisplay(entry.rank, isMyRank);
    const scoreColor = getReliabilityScoreColor(entry.reliabilityScore);

    return (
      <div
        className={`group flex items-center gap-5 py-5 px-4 cursor-pointer transition-colors duration-200 ${
          isMyRank ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
        }`}
        onClick={() => handleProfileClick(entry.username)}
      >
        {/* Rank */}
        <div className="flex-shrink-0 w-10">
          <span className={`text-xl font-light tabular-nums transition-colors duration-300 ${rankDisplay.className}`}>
            {rankDisplay.number}
          </span>
        </div>

        {/* Profile Picture */}
        <div className="flex-shrink-0">
          {entry.profilePictureUrl ? (
            <img
              src={entry.profilePictureUrl}
              alt={entry.displayName}
              className="w-10 h-10 rounded-full object-cover border border-white/[0.08]"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <span className="text-[15px] font-light text-gray-400">
                {entry.displayName?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[15px] text-white font-normal truncate">
              {entry.displayName}
            </p>
            {isMyRank && (
              <span className="px-2 py-0.5 text-[11px] uppercase tracking-[0.08em] text-gray-300 rounded-full border border-white/[0.15]">
                You
              </span>
            )}
          </div>
          <p className="text-[13px] text-gray-500 font-light truncate">@{entry.username}</p>

          {/* User Tags */}
          {(() => {
            const displayTags = mergeTagsWithTier(entry.tags, entry.reliabilityScore);
            return displayTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {displayTags.map((tag, index) => (
                  <UserTag key={index} tag={tag} />
                ))}
              </div>
            ) : null;
          })()}
        </div>

        {/* Reliability Score */}
        <div className="flex-shrink-0 text-right">
          <p
            className={`text-2xl font-light tabular-nums tracking-[-0.01em] ${entry.reliabilityScore >= 3500 ? 'reliability-score-gradient' : ''}`}
            style={entry.reliabilityScore >= 3500 ? {} : { color: scoreColor }}
          >
            {entry.reliabilityScore}
          </p>
          <p className="text-[11px] uppercase tracking-[0.08em] text-gray-500">Score</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Navigation />

      <div className="max-w-4xl mx-auto px-6 pt-16 pb-28">
        {/* Header */}
        <div className="mb-14">
          <h1 className="text-4xl font-light tracking-[-0.02em] leading-[1.1] mb-3">Leaderboard</h1>
          <p className="text-[15px] text-gray-400 font-light">
            Top 100 users ranked by reliability score
            {leaderboard?.lastUpdated && (
              <span className="ml-2 text-gray-500 text-[13px]">
                &middot; Updated {(() => {
                  const date = new Date(leaderboard.lastUpdated);
                  // Add 1 minute to account for delay
                  date.setMinutes(date.getMinutes() + 1);
                  return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                })()}
              </span>
            )}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <p className="py-6 text-[15px] text-gray-500 font-light">Loading leaderboard...</p>
        )}

        {/* Error State */}
        {error && !loading && (
          <p className="border-l border-red-400/60 pl-4 text-[13px] text-red-400 font-light">{error}</p>
        )}

        {/* Content */}
        {!loading && !error && leaderboard && (
          <>
            {/* My Rank Card (if authenticated and not in top 100) */}
            {user && myRank && !leaderboard.rankings.find(r => r.userId === user.userId) && (
              <div className="mb-14">
                <h2 className="text-[15px] font-normal text-white mb-3">Your Rank</h2>
                <div className="-mx-4 border-y border-white/[0.08]">
                  <LeaderboardRow entry={myRank} isMyRank={true} />
                </div>
              </div>
            )}

            {/* Top 100 List */}
            {leaderboard.rankings.length > 0 ? (
              <div className="-mx-4 divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {leaderboard.rankings.map((entry) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    isMyRank={user && entry.userId === user.userId}
                  />
                ))}
              </div>
            ) : (
              <div className="border-t border-white/[0.15] pt-6">
                <h3 className="text-[16px] font-normal mb-1.5">No rankings yet</h3>
                <p className="text-[13px] text-gray-400 font-light leading-relaxed">
                  Be the first to complete tasks and earn a reliability score!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
