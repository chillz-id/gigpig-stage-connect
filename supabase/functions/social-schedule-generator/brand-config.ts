/**
 * Brand Configuration
 *
 * Maps events → Drive folders → Metricool accounts.
 * Used by the schedule generator to determine which brand's
 * social accounts to post to and where to find media.
 */

export interface BrandConfig {
  /** Display name for the brand */
  name: string;
  /** Patterns to match against organization names */
  orgNameMatch: string[];
  /** Patterns to match against event names */
  eventNameMatch: string[];
  /** Drive folder brand name (under Social Media Organizer/) */
  driveBrand: string;
  /** If this brand posts to another brand's accounts */
  postsAsBrand?: string;
  /** Tag to include in captions (e.g. @magicmiccomedy) */
  tagInCaption?: string;
  /** Platforms to post to */
  platforms: string[];
  /** Default hashtags for this brand */
  defaultHashtags: string[];
}

export const BRAND_CONFIG: Record<string, BrandConfig> = {
  'iD Comedy Club': {
    name: 'iD Comedy Club',
    orgNameMatch: ['iD Comedy Club', 'iD Comedy'],
    eventNameMatch: ['iD Comedy'],
    driveBrand: 'iD Comedy Club',
    platforms: ['instagram', 'facebook', 'tiktok', 'twitter'],
    defaultHashtags: ['#iDComedyClub', '#StandUpSydney', '#SydneyComedy'],
  },
  'Rory Lowe': {
    name: 'Rory Lowe',
    orgNameMatch: ['Rory Lowe'],
    eventNameMatch: ['Rory Lowe', 'Lowe Key'],
    driveBrand: 'Rory Lowe',
    platforms: ['instagram', 'facebook', 'tiktok', 'twitter'],
    defaultHashtags: ['#RoryLowe', '#StandUpComedy'],
  },
  'Magic Mic Comedy': {
    name: 'Magic Mic Comedy',
    orgNameMatch: ['Magic Mic'],
    eventNameMatch: ['Magic Mic'],
    driveBrand: 'Magic Mic Comedy',
    postsAsBrand: 'iD Comedy Club',
    tagInCaption: '@magicmiccomedy',
    platforms: ['instagram', 'facebook', 'tiktok', 'twitter'],
    defaultHashtags: ['#MagicMicComedy', '#SydneyComedy', '#OpenMic'],
  },
};

/**
 * Match an event to its brand config by name.
 * Returns the first matching brand config, or null if no match.
 */
export function matchEventToBrand(
  eventName: string,
  orgName?: string | null,
): BrandConfig | null {
  const lowerEvent = eventName.toLowerCase();
  const lowerOrg = orgName?.toLowerCase() ?? '';

  for (const config of Object.values(BRAND_CONFIG)) {
    // Check event name patterns
    for (const pattern of config.eventNameMatch) {
      if (lowerEvent.includes(pattern.toLowerCase())) {
        return config;
      }
    }
    // Check org name patterns
    for (const pattern of config.orgNameMatch) {
      if (lowerOrg.includes(pattern.toLowerCase())) {
        return config;
      }
    }
  }

  return null;
}
