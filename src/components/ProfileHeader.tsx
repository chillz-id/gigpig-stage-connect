import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, MapPin, Calendar, Trophy, Shield, MessageSquare, Award, LogOut } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';

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
  const { uploadFile, uploading } = useFileUpload({
    bucket: 'profile-images',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  });

  const getMembershipBadgeColor = (membership: string) => {
    switch (membership) {
      case 'premium':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'pro':
        return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white';
      default:
        return 'bg-gradient-to-r from-purple-600 to-pink-500 text-white';
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Avatar upload started:', file.name);
      const url = await uploadFile(file);
      if (url) {
        console.log('Avatar uploaded successfully:', url);
        // Pass the original event to maintain compatibility
        onImageSelect(event);
      }
    }
  };

  // Provide default values for potentially undefined properties
  const membership = user.membership || 'basic';
  const userName = user.name || 'User';
  const userBio = user.bio || 'No bio available';
  const userLocation = user.location || 'Location not set';
  const joinDate = user.joinDate || 'Recently joined';
  const showCount = user.stats?.showsPerformed || 0;

  return (
    <Card className="professional-card mb-8">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-2xl">{userName[0]}</AvatarFallback>
            </Avatar>
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
                disabled={uploading}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{userName}</h1>
              {user.isVerified && <Shield className="w-6 h-6 text-blue-500" />}
              <Badge className={getMembershipBadgeColor(membership)}>
                {membership.toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-4">{userBio}</p>
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
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button variant="outline" size="sm">
              <Award className="w-4 h-4 mr-2" />
              Vouch
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
