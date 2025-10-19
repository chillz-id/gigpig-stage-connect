import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/contexts/ProfileContext';
import { Drama, Users, Briefcase, Camera, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ProfileContextBadge Component
 *
 * Displays the active profile context as a visual badge in page headers.
 * Provides visual feedback about which profile the user is currently viewing as.
 *
 * Features:
 * - Profile-specific icons and colors
 * - Optional label display (icon only or with text)
 * - Size variants (sm, md, lg)
 * - Consistent with multi-profile system design
 */

interface ProfileContextBadgeProps {
  /**
   * Show profile label text alongside icon
   * @default true
   */
  showLabel?: boolean;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional className for customization
   */
  className?: string;
}

const PROFILE_CONFIG = {
  comedian: {
    label: 'Comedian',
    icon: Drama,
    colorClass: 'bg-red-500 hover:bg-red-600',
    textColorClass: 'text-white',
  },
  promoter: {
    label: 'Promoter',
    icon: Users,
    colorClass: 'bg-purple-500 hover:bg-purple-600',
    textColorClass: 'text-white',
  },
  manager: {
    label: 'Manager',
    icon: Briefcase,
    colorClass: 'bg-blue-500 hover:bg-blue-600',
    textColorClass: 'text-white',
  },
  photographer: {
    label: 'Photographer',
    icon: Camera,
    colorClass: 'bg-orange-500 hover:bg-orange-600',
    textColorClass: 'text-white',
  },
  videographer: {
    label: 'Videographer',
    icon: Video,
    colorClass: 'bg-teal-500 hover:bg-teal-600',
    textColorClass: 'text-white',
  },
} as const;

const SIZE_CONFIG = {
  sm: {
    iconSize: 'h-3 w-3',
    textSize: 'text-xs',
    padding: 'px-2 py-0.5',
  },
  md: {
    iconSize: 'h-4 w-4',
    textSize: 'text-sm',
    padding: 'px-2.5 py-1',
  },
  lg: {
    iconSize: 'h-5 w-5',
    textSize: 'text-base',
    padding: 'px-3 py-1.5',
  },
} as const;

export function ProfileContextBadge({
  showLabel = true,
  size = 'md',
  className
}: ProfileContextBadgeProps) {
  const { activeProfile } = useProfile();

  // Don't show if no active profile
  if (!activeProfile) {
    return null;
  }

  const config = PROFILE_CONFIG[activeProfile];
  const sizeConfig = SIZE_CONFIG[size];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <Badge
      className={cn(
        config.colorClass,
        config.textColorClass,
        sizeConfig.padding,
        'font-medium transition-colors flex items-center gap-1.5 w-fit',
        className
      )}
    >
      <Icon className={cn(sizeConfig.iconSize)} />
      {showLabel && (
        <span className={cn(sizeConfig.textSize)}>
          {config.label}
        </span>
      )}
    </Badge>
  );
}

/**
 * ProfileContextIndicator Component
 *
 * Displays active profile context as an inline text indicator (non-badge variant).
 * Useful for page titles or headers where a badge might be too prominent.
 */

interface ProfileContextIndicatorProps {
  /**
   * Prefix text before profile name
   * @default 'Viewing as'
   */
  prefix?: string;

  /**
   * Additional className for customization
   */
  className?: string;
}

export function ProfileContextIndicator({
  prefix = 'Viewing as',
  className
}: ProfileContextIndicatorProps) {
  const { activeProfile } = useProfile();

  if (!activeProfile) {
    return null;
  }

  const config = PROFILE_CONFIG[activeProfile];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <span className={cn('flex items-center gap-2 text-sm', className)}>
      <span className="text-muted-foreground">{prefix}:</span>
      <span className="flex items-center gap-1.5 font-medium">
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    </span>
  );
}
