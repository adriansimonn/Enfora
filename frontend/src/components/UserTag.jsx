/**
 * UserTag Component
 * Displays a tag badge for user roles, tiers, and achievements
 */

export default function UserTag({ tag }) {
  if (!tag || !tag.type || !tag.label || !tag.color) {
    return null;
  }

  // Define color classes based on tag color
  const getColorClasses = (color) => {
    const colorMap = {
      // Role tags
      'red-bright': 'bg-red-500/15 text-red-300 border-red-500/30',
      'red-dark': 'bg-red-900/30 text-red-300/80 border-red-800/60',
      'blue': 'bg-blue-500/15 text-blue-300 border-blue-500/30',

      // Reliability tier tags - matching the analytics panel colors
      'red': 'text-red-400 border-red-400/30',
      'yellow': 'text-yellow-400 border-yellow-400/30',
      'green': 'text-green-400 border-green-400/30',
      'blue-tier': 'text-blue-400 border-blue-400/30',
      'platinum': 'platinum-text-gradient border-white/25',

      // Default fallback
      'default': 'text-gray-400 border-white/[0.15]'
    };

    return colorMap[color] || colorMap['default'];
  };

  const colorClasses = getColorClasses(tag.color);

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-normal tracking-[0.02em]
        border transition-all duration-200
        ${colorClasses}
      `}
      title={`${tag.type}: ${tag.label}`}
    >
      {tag.label}
    </span>
  );
}
