/**
 * Utility functions for displaying user names according to their preferences
 */

export type NameDisplayPreference = 'real' | 'stage' | 'both';

export interface NameDisplayOptions {
  firstName?: string;
  lastName?: string;
  stageName?: string;
  nameDisplayPreference?: NameDisplayPreference;
}

/**
 * Get the display name for a user based on their preference
 * @param options - The name display options
 * @returns The formatted display name
 */
export function getDisplayName(options: NameDisplayOptions): string {
  const { firstName = '', lastName = '', stageName = '', nameDisplayPreference = 'real' } = options;
  
  const realName = `${firstName} ${lastName}`.trim();
  
  switch (nameDisplayPreference) {
    case 'stage':
      // If no stage name, fall back to real name
      return stageName || realName;
      
    case 'both':
      // If stage name exists, show "Stage Name (Real Name)"
      if (stageName) {
        return `${stageName} (${realName})`;
      }
      // Otherwise just show real name
      return realName;
      
    case 'real':
    default:
      return realName;
  }
}

/**
 * Get a shortened display name (for compact UI elements)
 * @param options - The name display options
 * @returns The shortened display name
 */
export function getShortDisplayName(options: NameDisplayOptions): string {
  const { firstName = '', lastName = '', stageName = '', nameDisplayPreference = 'real' } = options;
  
  switch (nameDisplayPreference) {
    case 'stage':
      // If no stage name, fall back to first name + last initial
      if (stageName) {
        return stageName;
      }
      return firstName + (lastName ? ` ${lastName.charAt(0)}.` : '');
      
    case 'both':
      // For short display with both, just use stage name if available
      if (stageName) {
        return stageName;
      }
      return firstName + (lastName ? ` ${lastName.charAt(0)}.` : '');
      
    case 'real':
    default:
      return firstName + (lastName ? ` ${lastName.charAt(0)}.` : '');
  }
}

/**
 * Get initials for avatar display
 * @param options - The name display options
 * @returns The initials (max 2 characters)
 */
export function getInitials(options: NameDisplayOptions): string {
  const { firstName = '', lastName = '', stageName = '', nameDisplayPreference = 'real' } = options;
  
  switch (nameDisplayPreference) {
    case 'stage':
      if (stageName) {
        // Get first letter of first two words in stage name
        const words = stageName.split(' ').filter(w => w.length > 0);
        if (words.length >= 2) {
          return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
        }
        return stageName.substring(0, 2).toUpperCase();
      }
      // Fall back to real name initials
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      
    case 'both':
      // For initials with both preference, use stage name if available
      if (stageName) {
        const words = stageName.split(' ').filter(w => w.length > 0);
        if (words.length >= 2) {
          return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
        }
        return stageName.substring(0, 2).toUpperCase();
      }
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      
    case 'real':
    default:
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }
}