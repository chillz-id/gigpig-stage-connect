/**
 * ClaimProfileModal
 *
 * Modal component for claiming directory profiles during signup.
 * Shows matched directory profile info and allows user to claim it
 * or skip to create a new profile.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, User, Check, X } from 'lucide-react';
import type { ClaimableProfile } from '@/types/directory';

interface ClaimProfileModalProps {
  profiles: ClaimableProfile[];
  onClaim: (profileId: string) => Promise<void>;
  onSkip: () => void;
  isOpen?: boolean;
}

export function ClaimProfileModal({
  profiles,
  onClaim,
  onSkip,
  isOpen = true,
}: ClaimProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const profile = profiles[currentIndex];

  if (!profile) {
    return null;
  }

  const handleClaim = async () => {
    setIsLoading(true);
    try {
      await onClaim(profile.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex < profiles.length - 1) {
      // Show next profile if there are more
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more profiles, skip entirely
      onSkip();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">Is this you?</DialogTitle>
          <DialogDescription>
            We found an existing profile that matches your email. Claim it to import your photos and info.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-4">
          {/* Profile Avatar */}
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={profile.primary_headshot_url || undefined} alt={profile.stage_name} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {getInitials(profile.stage_name)}
            </AvatarFallback>
          </Avatar>

          {/* Stage Name */}
          <h3 className="text-2xl font-bold text-center">{profile.stage_name}</h3>

          {/* Bio Preview */}
          {profile.short_bio && (
            <p className="text-sm text-muted-foreground text-center max-w-xs line-clamp-2">
              {profile.short_bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex gap-4">
            {profile.photo_count > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Camera className="h-3 w-3" />
                {profile.photo_count} photo{profile.photo_count !== 1 ? 's' : ''}
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <User className="h-3 w-3" />
              Directory Profile
            </Badge>
          </div>
        </div>

        {profiles.length > 1 && (
          <p className="text-xs text-center text-muted-foreground">
            Profile {currentIndex + 1} of {profiles.length}
          </p>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isLoading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            {profiles.length > 1 && currentIndex < profiles.length - 1 ? 'Skip This One' : "Not Me"}
          </Button>
          <Button
            onClick={handleClaim}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Claiming...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Claim Profile
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ClaimProfileModal;
