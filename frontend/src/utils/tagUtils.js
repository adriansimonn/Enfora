/**
 * Tag Utilities
 * Functions for managing and computing user tags
 */

/**
 * Get reliability tier tag based on score
 * Matches the tier definitions from the ReliabilityScoreModal
 *
 * Tier Ranges:
 * - Inconsistent or Beginner: <300
 * - Building Discipline: 300-999
 * - Reliable: 1000-1999
 * - Elite: 2000-3499
 * - Platinum: 3500+
 */
export function getReliabilityTierTag(reliabilityScore) {
  if (reliabilityScore >= 3500) {
    return { type: 'tier', label: 'Platinum', color: 'platinum' };
  }
  if (reliabilityScore >= 2000) {
    return { type: 'tier', label: 'Elite', color: 'blue-tier' };
  }
  if (reliabilityScore >= 1000) {
    return { type: 'tier', label: 'Reliable', color: 'green' };
  }
  if (reliabilityScore >= 300) {
    return { type: 'tier', label: 'Building Discipline', color: 'yellow' };
  }
  if (reliabilityScore > 0) {
    return { type: 'tier', label: 'Inconsistent', color: 'red' };
  }
  // No tier tag for users with 0 score
  return null;
}

/**
 * Merge manual tags with computed tier tag
 * @param {Array} manualTags - Tags from the database (role tags, achievement tags, etc.)
 * @param {number} reliabilityScore - Current reliability score
 * @returns {Array} Combined array of tags with tier tag computed dynamically
 *
 * Display Order: Role tags (Developer, Admin, Reviewer) → Tier tag (reliability score tier)
 */
export function mergeTagsWithTier(manualTags = [], reliabilityScore = 0) {
  // Filter out any manually set tier tags (they should be computed only)
  const nonTierTags = manualTags.filter(tag => tag.type !== 'tier');

  // Get the computed tier tag
  const tierTag = getReliabilityTierTag(reliabilityScore);

  // Combine: role tags first, then tier tag at the end
  if (tierTag) {
    return [...nonTierTags, tierTag];
  }

  return nonTierTags;
}

/**
 * Filter out tier tags from tag array
 * Use this before saving tags to the database to prevent manual tier tags
 */
export function filterOutTierTags(tags = []) {
  return tags.filter(tag => tag.type !== 'tier');
}
