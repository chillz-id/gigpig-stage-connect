import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ProfileContextBadge } from '@/components/profile/ProfileContextBadge';
import { cn } from '@/lib/utils';

/**
 * PageHeader Component
 *
 * Standardized page header with profile context awareness.
 * Provides consistent header layout across profile-aware pages.
 *
 * Features:
 * - Responsive layout (column on mobile, row on desktop)
 * - Optional profile context badge
 * - Profile-aware description text
 * - Theme support
 * - Customizable through children and className
 */

interface PageHeaderProps {
  /**
   * Main page title
   */
  title: string;

  /**
   * Page description (can be a string or React node for profile-aware content)
   */
  description?: React.ReactNode;

  /**
   * Show profile context badge
   * @default true
   */
  showProfileBadge?: boolean;

  /**
   * Profile badge size
   * @default 'md'
   */
  badgeSize?: 'sm' | 'md' | 'lg';

  /**
   * Additional actions or elements to display in the header
   */
  actions?: React.ReactNode;

  /**
   * Additional className for the header container
   */
  className?: string;

  /**
   * Additional className for the title
   */
  titleClassName?: string;

  /**
   * Additional className for the description
   */
  descriptionClassName?: string;
}

export function PageHeader({
  title,
  description,
  showProfileBadge = true,
  badgeSize = 'md',
  actions,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  const { theme } = useTheme();

  return (
    <div className={cn('mb-6 sm:mb-8', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 flex-1">
          <h1 className={cn(
            'text-2xl sm:text-3xl font-bold text-white',
            titleClassName
          )}>
            {title}
          </h1>
          {showProfileBadge && <ProfileContextBadge size={badgeSize} />}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      {description && (
        <p className={cn(
          theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300',
          descriptionClassName
        )}>
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * ProfileAwareDescription Component
 *
 * Helper component for creating profile-aware descriptions.
 * Renders different text based on the active profile.
 */

interface ProfileAwareDescriptionProps {
  /**
   * Default description (shown when no profile is active or no match)
   */
  default: string;

  /**
   * Profile-specific descriptions
   */
  profiles?: {
    comedian?: string;
    promoter?: string;
    manager?: string;
    photographer?: string;
    videographer?: string;
  };
}

export function ProfileAwareDescription({
  default: defaultText,
  profiles = {},
}: ProfileAwareDescriptionProps) {
  const { useProfile } = require('@/contexts/ProfileContext');
  const { activeProfile } = useProfile();

  if (!activeProfile || !profiles[activeProfile]) {
    return <>{defaultText}</>;
  }

  return <>{profiles[activeProfile]}</>;
}
