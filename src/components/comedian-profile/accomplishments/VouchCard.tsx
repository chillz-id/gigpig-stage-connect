import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';

interface OrganizationInfo {
  id: string;
  display_name: string;
  logo_url?: string | null;
}

interface VouchCardProps {
  /** User's avatar URL */
  userImg: string;
  /** User's display name */
  userName: string;
  /** The vouch message */
  body: string;
  /** Organization info when vouch is on behalf of an org */
  organization?: OrganizationInfo | null;
}

/**
 * VouchCard Component
 *
 * Displays a vouch/endorsement card with support for organizational vouches.
 * When an organization is present, the card shows:
 * - Organization logo + name (primary)
 * - User name underneath (secondary)
 * - A coin-flip animation alternating between org logo and user avatar every 3s
 *
 * When no organization, shows personal vouch style:
 * - User avatar + name only
 */
const VouchCard: React.FC<VouchCardProps> = ({
  userImg,
  userName,
  body,
  organization
}) => {
  const [showOrgAvatar, setShowOrgAvatar] = useState(true);
  const isOrgVouch = !!organization;

  // Coin flip animation - alternates between org logo and user avatar every 3s
  useEffect(() => {
    if (!isOrgVouch) return;

    const interval = setInterval(() => {
      setShowOrgAvatar(prev => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOrgVouch]);

  return (
    <figure className={cn(
      "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
      // light styles
      "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
      // dark styles
      "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
    )}>
      <div className="flex flex-row items-center gap-3">
        {/* Avatar with coin-flip animation for org vouches */}
        <div className="relative w-10 h-10 [perspective:1000px]">
          {isOrgVouch ? (
            <>
              {/* Coin flip container */}
              <div
                className={cn(
                  "absolute inset-0 transition-transform duration-700 [transform-style:preserve-3d]",
                  showOrgAvatar ? "" : "[transform:rotateY(180deg)]"
                )}
              >
                {/* Front - Org logo */}
                <div className="absolute inset-0 [backface-visibility:hidden]">
                  <OptimizedAvatar
                    src={organization.logo_url}
                    name={organization.display_name}
                    size="sm"
                    className="w-10 h-10"
                  />
                </div>
                {/* Back - User avatar */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <OptimizedAvatar
                    src={userImg}
                    name={userName}
                    size="sm"
                    className="w-10 h-10"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Personal vouch - just user avatar */
            <OptimizedAvatar
              src={userImg}
              name={userName}
              size="sm"
              className="w-10 h-10"
            />
          )}
        </div>

        {/* Name display */}
        <div className="flex flex-col min-w-0">
          {isOrgVouch ? (
            <>
              {/* Org name - primary */}
              <figcaption className="text-sm font-semibold dark:text-white truncate">
                {organization.display_name}
              </figcaption>
              {/* User name - secondary */}
              <p className="text-xs text-gray-500 dark:text-white/50 truncate">
                {userName}
              </p>
            </>
          ) : (
            /* Personal vouch - just user name */
            <figcaption className="text-sm font-medium dark:text-white truncate">
              {userName}
            </figcaption>
          )}
        </div>
      </div>

      <blockquote className="mt-3 text-sm dark:text-white/90 line-clamp-3">
        {body}
      </blockquote>
    </figure>
  );
};

export default VouchCard;
