import { useEffect } from 'react';

export default function ReliabilityScoreModal({ score, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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

    if (score >= 3500) return null;
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

  const tiers = [
    { name: "Inconsistent or Beginner", range: "<300", color: "from-red-400 to-red-500", isCurrent: score < 300 },
    { name: "Building Discipline", range: "300-999", color: "from-yellow-400 to-yellow-500", isCurrent: score >= 300 && score < 1000 },
    { name: "Reliable", range: "1000-1999", color: "from-green-400 to-green-500", isCurrent: score >= 1000 && score < 2000 },
    { name: "Elite", range: "2000-3499", color: "from-blue-400 to-blue-500", isCurrent: score >= 2000 && score < 3500 },
    { name: "Platinum", range: "3500+", isCurrent: score >= 3500 },
  ];

  const currentTier = tiers.find((tier) => tier.isCurrent);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/[0.08] rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08] flex-shrink-0">
          <h2 className="text-xl font-light text-white tracking-[-0.01em]">Reliability Score</h2>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-gray-500 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-[14px] text-gray-400 font-light leading-relaxed">
            The Reliability Score is Enfora's flagship metric that measures your consistency and discipline
            in creating and completing tasks.
          </p>

          {/* Current Score */}
          <div className="mt-8 border-t border-white/[0.15] pt-5">
            <p className="text-[13px] text-gray-400 font-light mb-2">Current score</p>
            <div className="flex items-baseline gap-4">
              <span
                className={`text-5xl font-light tabular-nums tracking-[-0.02em] ${score >= 3500 ? 'reliability-score-gradient' : ''}`}
                style={score >= 3500 ? {} : { color: getReliabilityScoreColor(score) }}
              >
                {score}
              </span>
              <span className="text-[15px] font-normal text-white">{currentTier.name}</span>
            </div>
          </div>

          {/* Tiers */}
          <div className="mt-10">
            <h3 className="text-[15px] font-normal text-white mb-2">Score Tiers</h3>
            <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {tiers.map((tier) => (
                <div key={tier.name} className="flex items-center gap-4 py-3.5">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      tier.name === "Platinum" ? 'platinum-badge-gradient' : `bg-gradient-to-r ${tier.color}`
                    }`}
                  />
                  <span
                    className={`flex-1 text-[14px] ${
                      tier.name === "Platinum"
                        ? 'platinum-text-gradient font-normal'
                        : tier.isCurrent
                        ? 'text-white font-normal'
                        : 'text-gray-400 font-light'
                    }`}
                  >
                    {tier.name}
                  </span>
                  {tier.isCurrent && (
                    <span className="text-[11px] uppercase tracking-[0.08em] text-gray-400">Current</span>
                  )}
                  <span className="w-20 text-right text-[13px] text-gray-500 font-light tabular-nums">{tier.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
