/**
 * Profanity Filter Utility
 *
 * Validates URL slugs to prevent offensive or inappropriate content.
 * Uses a comprehensive list of prohibited terms including slurs, profanity, and hate speech.
 */

// Common profanity and offensive terms
// This list should be expanded based on moderation needs
const PROHIBITED_TERMS = [
  // Profanity
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'piss',
  'cock', 'dick', 'pussy', 'cunt', 'whore', 'slut', 'fag', 'dyke',

  // Slurs and hate speech
  'nigger', 'nigga', 'chink', 'gook', 'kike', 'spic', 'wetback', 'beaner',
  'raghead', 'towelhead', 'injun', 'redskin', 'jap', 'wop', 'kraut',

  // Sexual content
  'porn', 'sex', 'anal', 'oral', 'xxx', 'nsfw', 'hentai', 'nude',

  // Violence
  'kill', 'murder', 'rape', 'terrorist', 'bomb', 'gun', 'weapon',

  // Drugs
  'cocaine', 'heroin', 'meth', 'weed', 'marijuana', 'drug',

  // Other inappropriate
  'nazi', 'hitler', 'isis', 'taliban', 'pedo', 'pedophile',

  // Variations and leetspeak
  'fck', 'fuk', 'sht', 'btch', 'a$$', 'a55', 'p0rn', 'k!ll',

  // Reserved terms that could cause confusion
  'admin', 'root', 'moderator', 'system', 'api', 'null', 'undefined',
];

/**
 * Normalizes a string for comparison by:
 * - Converting to lowercase
 * - Removing special characters
 * - Replacing common leetspeak substitutions
 */
const normalizeForComparison = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
    .replace(/0/g, 'o')        // Leetspeak: 0 -> o
    .replace(/1/g, 'i')        // Leetspeak: 1 -> i
    .replace(/3/g, 'e')        // Leetspeak: 3 -> e
    .replace(/4/g, 'a')        // Leetspeak: 4 -> a
    .replace(/5/g, 's')        // Leetspeak: 5 -> s
    .replace(/7/g, 't')        // Leetspeak: 7 -> t
    .replace(/\$/g, 's')       // Leetspeak: $ -> s
    .replace(/@/g, 'a');       // Leetspeak: @ -> a
};

/**
 * Validates if a slug contains prohibited terms
 *
 * @param slug - The URL slug to validate
 * @returns Object with isValid boolean and reason string if invalid
 */
export const validateSlugContent = (slug: string): { isValid: boolean; reason?: string } => {
  if (!slug || slug.trim().length === 0) {
    return { isValid: false, reason: 'URL cannot be empty' };
  }

  const normalized = normalizeForComparison(slug);

  // Check for exact matches and substrings
  for (const term of PROHIBITED_TERMS) {
    if (normalized.includes(term)) {
      return {
        isValid: false,
        reason: 'This URL contains inappropriate content. Please choose a different URL.'
      };
    }
  }

  // Additional validation rules
  if (slug.length < 3) {
    return { isValid: false, reason: 'URL must be at least 3 characters long' };
  }

  if (slug.length > 50) {
    return { isValid: false, reason: 'URL must be less than 50 characters' };
  }

  // Only allow alphanumeric and hyphens
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    return { isValid: false, reason: 'URL can only contain letters, numbers, and hyphens' };
  }

  // Can't start or end with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { isValid: false, reason: 'URL cannot start or end with a hyphen' };
  }

  // Can't have consecutive hyphens
  if (slug.includes('--')) {
    return { isValid: false, reason: 'URL cannot contain consecutive hyphens' };
  }

  return { isValid: true };
};

/**
 * Checks if a slug contains profanity (for display/logging purposes)
 *
 * @param slug - The URL slug to check
 * @returns True if slug contains prohibited terms
 */
export const containsProfanity = (slug: string): boolean => {
  const result = validateSlugContent(slug);
  return !result.isValid && result.reason?.includes('inappropriate content');
};
