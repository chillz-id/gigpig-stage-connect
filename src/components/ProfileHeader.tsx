
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Camera, MapPin, Calendar, Trophy, Shield, ExternalLink, Award, LogOut, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProfileUrlEditor } from '@/components/profile/ProfileUrlEditor';
import { useAuth } from '@/contexts/AuthContext';
import { forceNavigate, navigateToProfile } from '@/utils/navigation';

interface ProfileHeaderProps {
  user: any;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onImageSelect,
  onLogout
}) => {
  const { toast } = useToast();
  const { profile } = useAuth();

  const getMembershipBadgeColor = (membership: string) => {
    switch (membership) {
      case 'premium':
        return 'bg-gradient-to-r from-gray-700 to-gray-900 text-white';
      case 'pro':
        return 'bg-gradient-to-r from-blue-600 to-gray-800 text-white';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-800 text-white';
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Pass the event to parent component to handle crop modal
    onImageSelect(event);
  };

  // Provide default values for potentially undefined properties
  const membership = user.membership || 'basic';

  // Compute display name based on name_display_preference
  const getDisplayName = () => {
    const preference = user.name_display_preference || 'real';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const stageName = user.stage_name || '';
    const realName = `${firstName} ${lastName}`.trim();

    switch (preference) {
      case 'stage':
        return stageName || realName || 'User';
      case 'both':
        if (stageName && realName) {
          return `${stageName} - ${realName}`;
        }
        return stageName || realName || 'User';
      case 'real':
      default:
        return realName || stageName || 'User';
    }
  };

  const userName = getDisplayName();
  const userBio = user.bio || 'No bio available';
  const userLocation = user.location || 'Location not set';
  const joinDate = user.joinDate || 'Recently joined';
  const showCount = user.stats?.showsPerformed || 0;

  return (
    <Card className="professional-card mb-8">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative">
            <OptimizedAvatar
              src={user.avatar}
              name={userName}
              size="xl"
              className="w-32 h-32"
              priority
            />
            <div className="absolute bottom-0 right-0">
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg">
                  <Camera className="w-4 h-4 text-primary-foreground" />
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{userName}</h1>
              {user.isVerified && <Shield className="w-6 h-6 text-blue-500" />}
              {membership !== 'basic' && (
                <Badge className={getMembershipBadgeColor(membership)}>
                  {membership.toUpperCase()}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-4">{userBio}</p>
            
            {/* Profile URL Editor */}
            <div className="mb-4">
              <ProfileUrlEditor
                userId={user.id}
                currentSlug={profile?.profile_slug}
                userName={userName}
                isOwner={true}
              />
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{userLocation}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Member since {joinDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{showCount} shows performed</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="professional-button"
              size="sm"
              onClick={() => {
                const slug = profile?.profile_slug || user.id;
                // Use forceNavigate for reliable cross-nested-route navigation
                navigateToProfile('comedian', slug);
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              EPK
            </Button>
            <Button className="professional-button" size="sm" onClick={() => {
              // Navigate to profile page with vouches tab using forceNavigate for reliability
              forceNavigate('/profile?tab=vouches');
            }}>
              <Crown className="w-4 h-4 mr-2 text-yellow-500" />
              Vouches
            </Button>
            <Button className="professional-button" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
