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
      'red-bright': 'bg-red-500 text-white border-red-600',
      'red-dark': 'bg-red-800 text-white border-red-900',
      'blue': 'bg-blue-500 text-white border-blue-600',

      // Reliability tier tags - matching the analytics panel colors
      'red': 'bg-gradient-to-r from-red-400 to-red-500 text-white border-red-500/50',
      'yellow': 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white border-yellow-500/50',
      'green': 'bg-gradient-to-r from-green-400 to-green-500 text-white border-green-500/50',
      'blue-tier': 'bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-500/50',
      'platinum': 'platinum-badge-gradient text-white border-white/20',

      // Default fallback
      'default': 'bg-white/10 text-gray-300 border-white/20'
    };

    return colorMap[color] || colorMap['default'];
  };

  const colorClasses = getColorClasses(tag.color);

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        border transition-all duration-200
        ${colorClasses}
      `}
      title={`${tag.type}: ${tag.label}`}
    >
      {tag.label}
    </span>
  );
}
