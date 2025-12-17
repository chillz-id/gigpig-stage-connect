import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Cloud, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

/**
 * SyncBadge Component
 *
 * Displays the sync status and source for events that are synced from
 * external ticketing platforms (Humanitix, Eventbrite) or created on platform.
 *
 * Features:
 * - Source-specific icons and colors
 * - Last synced timestamp (relative time)
 * - Size variants (sm, md, lg)
 * - Tooltip-ready timestamp display
 */

export type EventSource = 'humanitix' | 'eventbrite' | 'platform';

interface SyncBadgeProps {
  /**
   * The source of the event data
   */
  source: EventSource | string | null;

  /**
   * Whether the event is synced from an external source
   */
  isSynced?: boolean | null;

  /**
   * When the event was last synced (ISO timestamp)
   */
  syncedAt?: string | null;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Show the last synced time
   * @default false
   */
  showTimestamp?: boolean;

  /**
   * Additional className for customization
   */
  className?: string;
}

const SOURCE_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  textColorClass: string;
}> = {
  humanitix: {
    label: 'Humanitix',
    icon: Cloud,
    colorClass: 'bg-emerald-500 hover:bg-emerald-600',
    textColorClass: 'text-white',
  },
  eventbrite: {
    label: 'Eventbrite',
    icon: Cloud,
    colorClass: 'bg-orange-500 hover:bg-orange-600',
    textColorClass: 'text-white',
  },
  platform: {
    label: 'Platform',
    icon: Monitor,
    colorClass: 'bg-blue-500 hover:bg-blue-600',
    textColorClass: 'text-white',
  },
};

const SIZE_CONFIG = {
  sm: {
    iconSize: 'h-3 w-3',
    textSize: 'text-xs',
    padding: 'px-2 py-0.5',
    gap: 'gap-1',
  },
  md: {
    iconSize: 'h-4 w-4',
    textSize: 'text-sm',
    padding: 'px-2.5 py-1',
    gap: 'gap-1.5',
  },
  lg: {
    iconSize: 'h-5 w-5',
    textSize: 'text-base',
    padding: 'px-3 py-1.5',
    gap: 'gap-2',
  },
} as const;

export function SyncBadge({
  source,
  isSynced,
  syncedAt,
  size = 'md',
  showTimestamp = false,
  className,
}: SyncBadgeProps) {
  // Normalize source to lowercase
  const normalizedSource = (source?.toLowerCase() ?? 'platform') as EventSource;
  const config = SOURCE_CONFIG[normalizedSource] ?? SOURCE_CONFIG.platform;
  const sizeConfig = SIZE_CONFIG[size];

  // Don't show for platform events unless explicitly requested
  if (normalizedSource === 'platform' && !isSynced) {
    return null;
  }

  const Icon = config.icon;

  // Format relative time for synced_at
  const relativeTime = syncedAt
    ? formatDistanceToNow(new Date(syncedAt), { addSuffix: true })
    : null;

  return (
    <Badge
      className={cn(
        config.colorClass,
        config.textColorClass,
        sizeConfig.padding,
        sizeConfig.gap,
        'font-medium transition-colors flex items-center w-fit',
        className
      )}
      title={syncedAt ? `Last synced: ${new Date(syncedAt).toLocaleString()}` : undefined}
    >
      <Icon className={cn(sizeConfig.iconSize)} />
      <span className={cn(sizeConfig.textSize)}>
        {config.label}
      </span>
      {showTimestamp && relativeTime && (
        <span className={cn(sizeConfig.textSize, 'opacity-75')}>
          ({relativeTime})
        </span>
      )}
    </Badge>
  );
}

/**
 * SyncIndicator Component
 *
 * A smaller, more subtle indicator for sync status.
 * Shows a refresh icon with optional spinning animation.
 */

interface SyncIndicatorProps {
  /**
   * Whether the event is currently synced
   */
  isSynced?: boolean | null;

  /**
   * Whether sync is currently in progress
   */
  isSyncing?: boolean;

  /**
   * Additional className for customization
   */
  className?: string;
}

export function SyncIndicator({
  isSynced,
  isSyncing = false,
  className,
}: SyncIndicatorProps) {
  if (!isSynced) {
    return null;
  }

  return (
    <RefreshCw
      className={cn(
        'h-4 w-4 text-emerald-500',
        isSyncing && 'animate-spin',
        className
      )}
      title={isSyncing ? 'Syncing...' : 'Synced from external source'}
    />
  );
}

/**
 * EventSourceLabel Component
 *
 * Inline text indicator for event source, useful in tables or lists.
 */

interface EventSourceLabelProps {
  /**
   * The source of the event data
   */
  source: EventSource | string | null;

  /**
   * Additional className for customization
   */
  className?: string;
}

export function EventSourceLabel({
  source,
  className,
}: EventSourceLabelProps) {
  const normalizedSource = (source?.toLowerCase() ?? 'platform') as EventSource;
  const config = SOURCE_CONFIG[normalizedSource] ?? SOURCE_CONFIG.platform;

  const Icon = config.icon;

  return (
    <span className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
