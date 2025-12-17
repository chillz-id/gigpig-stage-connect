/**
 * Example component showing how to use the name display utilities
 */
import React from 'react';
import { getDisplayName, getShortDisplayName, getInitials } from '@/utils/nameDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';

interface UserProfile {
  firstName: string;
  lastName: string;
  stageName?: string;
  nameDisplayPreference: 'real' | 'stage' | 'both';
  avatarUrl?: string;
}

export const NameDisplayExample: React.FC<{ user: UserProfile }> = ({ user }) => {
  const displayName = getDisplayName({
    firstName: user.firstName,
    lastName: user.lastName,
    stageName: user.stageName,
    nameDisplayPreference: user.nameDisplayPreference
  });

  const shortName = getShortDisplayName({
    firstName: user.firstName,
    lastName: user.lastName,
    stageName: user.stageName,
    nameDisplayPreference: user.nameDisplayPreference
  });

  const initials = getInitials({
    firstName: user.firstName,
    lastName: user.lastName,
    stageName: user.stageName,
    nameDisplayPreference: user.nameDisplayPreference
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile Display</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Full display with avatar */}
        <div className="flex items-center gap-4">
          <OptimizedAvatar
            src={user.avatarUrl}
            name={displayName}
            className="h-12 w-12"
          />
          <div>
            <h3 className="font-semibold">{displayName}</h3>
            <p className="text-sm text-gray-500">Full display name</p>
          </div>
        </div>

        {/* Compact display */}
        <div className="flex items-center gap-4">
          <OptimizedAvatar
            name={shortName}
            className="h-8 w-8"
            fallbackClassName="text-xs"
          />
          <div>
            <p className="text-sm font-medium">{shortName}</p>
            <p className="text-xs text-gray-500">Compact display</p>
          </div>
        </div>

        {/* Display preferences info */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <p className="text-sm">
            <strong>Display Preference:</strong> {user.nameDisplayPreference}
          </p>
          {user.stageName && (
            <p className="text-sm">
              <strong>Stage Name:</strong> {user.stageName}
            </p>
          )}
          <p className="text-sm">
            <strong>Real Name:</strong> {user.firstName} {user.lastName}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};