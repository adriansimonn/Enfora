import { useState, useEffect } from "react";
import { fetchAnalytics } from "../services/api";

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Analytics</h2>
        <div className="text-center py-8 text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Analytics</h2>
        <div className="text-center py-8 text-red-400">{error}</div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const formatHours = (hours) => {
    if (hours < 1) {
      return `${(hours * 60).toFixed(0)} min`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} hrs`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours.toFixed(0)}h`;
    }
  };

  // Helper function to interpolate between colors
  const interpolateColor = (value, min, mid, max, colorMin, colorMid, colorMax) => {
    // Clamp value between min and max
    const clampedValue = Math.max(min, Math.min(max, value));

    let t, color1, color2;

    if (clampedValue <= mid) {
      // Interpolate between min and mid
      t = (clampedValue - min) / (mid - min);
      color1 = colorMin;
      color2 = colorMid;
    } else {
      // Interpolate between mid and max
      t = (clampedValue - mid) / (max - mid);
      color1 = colorMid;
      color2 = colorMax;
    }

    const r = Math.round(color1.r + (color2.r - color1.r) * t);
    const g = Math.round(color1.g + (color2.g - color1.g) * t);
    const b = Math.round(color1.b + (color2.b - color1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Color definitions (RGB values)
  const colors = {
    red: { r: 248, g: 113, b: 113 },      // red-400
    yellow: { r: 250, g: 204, b: 21 },    // yellow-400
    green: { r: 74, g: 222, b: 128 },     // green-400
    white: { r: 255, g: 255, b: 255 },    // white
  };

  // Calculate dynamic colors for metrics
  const getDisciplineColor = (score) => {
    if (score >= 0) {
      // From 0 (yellow) to 50+ (green)
      return interpolateColor(score, 0, 25, 50, colors.yellow, colors.yellow, colors.green);
    } else {
      // From 0 (yellow) to -10 and below (red)
      return interpolateColor(score, -10, -5, 0, colors.red, colors.red, colors.yellow);
    }
  };

  const getCompletionRateColor = (rate) => {
    // 50% and below (red), 70% (yellow), 100% (green)
    return interpolateColor(rate, 50, 70, 100, colors.red, colors.yellow, colors.green);
  };

  const getAverageTimeColor = (hours) => {
    // 1hr (red), 8hr (yellow), 24hr+ (green)
    return interpolateColor(hours, 1, 8, 24, colors.red, colors.yellow, colors.green);
  };

  const getStreakColor = (streak) => {
    // 0 (white) to 100 (green)
    return interpolateColor(streak, 0, 50, 100, colors.white, colors.green, colors.green);
  };

  const getStakeLostColor = (totalLost, avgStake, finishedCount) => {
    if (finishedCount === 0 || avgStake === 0) return 'rgb(74, 222, 128)'; // green if no tasks yet
    const maxLoss = avgStake * finishedCount;
    if (maxLoss === 0) return 'rgb(74, 222, 128)'; // green if no stakes
    // $0 (green) to max potential loss (red)
    return interpolateColor(totalLost, 0, maxLoss / 2, maxLoss, colors.green, colors.yellow, colors.red);
  };

  const getStakeAtRiskColor = (totalAtRisk, avgStake, pendingCount) => {
    if (pendingCount === 0 || avgStake === 0) return 'rgb(255, 255, 255)'; // white if no pending tasks

    // Calculate average stake per pending task
    const avgPendingStake = totalAtRisk / pendingCount;

    // Calculate ratio: (avg stake of pending tasks) / (overall avg stake)
    const ratio = avgPendingStake / avgStake;

    // ratio = 1 (white), ratio >= 1.25 (green)
    if (ratio >= 1.25) {
      return 'rgb(74, 222, 128)'; // green - betting more aggressively
    } else if (ratio >= 1) {
      // Interpolate from white to green between 1 and 1.25
      const t = (ratio - 1) / 0.25;
      const r = Math.round(255 + (74 - 255) * t);
      const g = Math.round(255 + (222 - 255) * t);
      const b = Math.round(255 + (128 - 255) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // ratio < 1 means betting less than average - keep white
      return 'rgb(255, 255, 255)';
    }
  };

  const MetricCard = ({ title, value, subtitle, icon, color = "white", style = {} }) => {
    return (
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className="text-2xl font-bold" style={{ color, ...style }}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {icon && <div className="text-gray-500 ml-2">{icon}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Your Analytics</h2>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Overall Metrics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Overall</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="ELO Rating"
            value={analytics.elo}
            subtitle="Overall performance metric"
            color="rgb(250, 204, 21)"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          <MetricCard
            title="Discipline Score"
            value={analytics.disciplineScore}
            subtitle={`${analytics.disciplineScore >= 0 ? '+' : ''}${analytics.disciplineScore} from baseline`}
            color={getDisciplineColor(analytics.disciplineScore)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Completion Metrics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Completion Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Completion Rate"
            value={formatPercentage(analytics.completionRate)}
            subtitle="Of all finished tasks"
            color={getCompletionRateColor(analytics.completionRate)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <MetricCard
            title="Avg. Time Before Deadline"
            value={analytics.averageCompletionTimeBeforeDeadline > 0
              ? formatHours(analytics.averageCompletionTimeBeforeDeadline)
              : "N/A"}
            subtitle="How early you complete"
            color={analytics.averageCompletionTimeBeforeDeadline > 0
              ? getAverageTimeColor(analytics.averageCompletionTimeBeforeDeadline)
              : "rgb(255, 255, 255)"}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            title="Current Streak"
            value={analytics.currentCompletionStreak}
            subtitle={`task${analytics.currentCompletionStreak !== 1 ? 's' : ''} in a row`}
            color={getStreakColor(analytics.currentCompletionStreak)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Financial Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Financial Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Stake Lost"
            value={formatCurrency(analytics.totalStakeLost)}
            subtitle="Lifetime losses"
            color={getStakeLostColor(analytics.totalStakeLost, analytics.averageStakePerTask, analytics.finishedTasksCount)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            }
          />
          <MetricCard
            title="Total Stake at Risk"
            value={formatCurrency(analytics.totalStakeAtRisk)}
            subtitle="From pending tasks"
            color={getStakeAtRiskColor(analytics.totalStakeAtRisk, analytics.averageStakePerTask, analytics.pendingTasksCount)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            title="Average Stake per Task"
            value={formatCurrency(analytics.averageStakePerTask)}
            subtitle="Across all tasks"
            color="rgb(255, 255, 255)"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <MetricCard
            title="Total to Charity"
            value={formatCurrency(analytics.totalMoneyToCharity)}
            subtitle="Failed charity tasks"
            color="rgb(255, 255, 255)"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}
