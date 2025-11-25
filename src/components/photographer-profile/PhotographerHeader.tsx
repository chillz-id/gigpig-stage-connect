import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Video, 
  MapPin, 
  Star, 
  Globe, 
  Instagram,
  Mail,
  Phone,
  Share2,
  Calendar
} from 'lucide-react';
import { PhotographerProfile } from '@/types/photographer';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PhotographerHeaderProps {
  photographer: PhotographerProfile;
  averageRating: number;
  reviewCount: number;
}

const PhotographerHeader: React.FC<PhotographerHeaderProps> = ({
  photographer,
  averageRating,
  reviewCount
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const profile = photographer.photographer_profile;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${photographer.name} - Photographer`,
          text: `Check out ${photographer.name}'s photography portfolio`,
          url
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'Profile link has been copied to clipboard',
      });
    }
  };

  const isOwnProfile = user?.id === photographer.id;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="w-32 h-32">
            <AvatarImage 
              src={photographer.avatar_url || ''} 
              alt={photographer.name || ''} 
            />
            <AvatarFallback className="text-2xl">
              {photographer.name?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{photographer.name}</h1>
              
              {/* Location */}
              {photographer.location && (
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  {photographer.location}
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {profile?.services_offered?.includes('photographer') && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Camera className="w-3 h-3 mr-1" />
                    Photographer
                  </Badge>
                )}
                {profile?.services_offered?.includes('videographer') && (
                  <Badge className="bg-red-100 text-red-800">
                    <Video className="w-3 h-3 mr-1" />
                    Videographer
                  </Badge>
                )}
                {photographer.is_verified && (
                  <Badge className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                )}
                {profile?.experience_years && profile.experience_years > 0 && (
                  <Badge variant="secondary">
                    {profile.experience_years}+ years experience
                  </Badge>
                )}
              </div>

              {/* Rating */}
              {reviewCount > 0 && (
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 font-medium">{averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-600">({reviewCount} vouches)</span>
                </div>
              )}

              {/* Contact Links */}
              <div className="flex flex-wrap gap-2">
                {photographer.website_url && (
                  <Button
                    size="sm"
                    className="professional-button"
                    onClick={() => window.open(photographer.website_url!, '_blank')}
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Website
                  </Button>
                )}
                {photographer.instagram_url && (
                  <Button
                    size="sm"
                    className="professional-button"
                    onClick={() => window.open(photographer.instagram_url!, '_blank')}
                  >
                    <Instagram className="w-4 h-4 mr-1" />
                    Instagram
                  </Button>
                )}
                {photographer.email && (
                  <Button
                    size="sm"
                    className="professional-button"
                    onClick={() => window.location.href = `mailto:${photographer.email}`}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                )}
                {photographer.phone && (
                  <Button
                    size="sm"
                    className="professional-button"
                    onClick={() => window.location.href = `tel:${photographer.phone}`}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="professional-button"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              {isOwnProfile && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    // Navigate to edit profile
                    toast({
                      title: 'Coming soon',
                      description: 'Profile editing will be available soon',
                    });
                  }}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotographerHeader;