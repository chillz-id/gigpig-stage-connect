import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  MapPin, 
  Mail, 
  Instagram, 
  Camera, 
  Video, 
  Star,
  DollarSign,
  Globe
} from 'lucide-react';
import { PhotographerProfile } from '@/types/photographer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PhotographerCardProps {
  photographer: PhotographerProfile & { vouch_stats?: any };
  isContacting: boolean;
  onContact: (photographerId: string, photographerEmail: string) => void;
}

const PhotographerCard: React.FC<PhotographerCardProps> = ({ 
  photographer, 
  isContacting, 
  onContact 
}) => {
  const { user, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const isIndustryUser = user && hasAnyRole(['comedian', 'promoter', 'admin', 'photographer', 'videographer']);
  const profile = photographer.photographer_profile;

  // Get vouch stats
  const averageRating = photographer.vouch_stats?.average_rating || 0;
  const vouchCount = photographer.vouch_stats?.total_vouches || 0;

  const handleCardClick = () => {
    navigate(`/photographers/${photographer.id}`);
  };

  const formatRate = (hourly?: number | null, event?: number | null) => {
    if (!hourly && !event) return 'Contact for rates';
    const parts = [];
    if (hourly) parts.push(`$${hourly}/hr`);
    if (event) parts.push(`$${event}/event`);
    return parts.join(' • ');
  };

  return (
    <Card 
      className="relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Portfolio Image */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={photographer.avatar_url || 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop'} 
          alt={photographer.name || 'Photographer'} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop';
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-4 right-4 flex gap-2">
          {profile?.services_offered?.includes('photographer') && (
            <Badge className="bg-blue-500/90 text-white">
              <Camera className="w-3 h-3 mr-1" />
              Photo
            </Badge>
          )}
          {profile?.services_offered?.includes('videographer') && (
            <Badge className="bg-red-500/90 text-white">
              <Video className="w-3 h-3 mr-1" />
              Video
            </Badge>
          )}
        </div>

        {/* Rating */}
        {vouchCount > 0 && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1 text-white">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-sm opacity-80">({vouchCount})</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name and Location */}
        <div className="mb-3">
          <h3 className="text-lg font-bold">{photographer.name || 'Unknown'}</h3>
          {photographer.location && (
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {photographer.location}
            </div>
          )}
        </div>

        {/* Specialties */}
        {profile?.specialties && profile.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {profile.specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {profile.specialties.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{profile.specialties.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Experience and Rate */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          {profile?.experience_years && (
            <span>{profile.experience_years}+ years exp.</span>
          )}
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span className="text-xs">
              {formatRate(profile?.rate_per_hour, profile?.rate_per_event)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {photographer.instagram_url && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-8 h-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(photographer.instagram_url!, '_blank');
                }}
              >
                <Instagram className="w-4 h-4" />
              </Button>
            )}
            {photographer.website_url && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-8 h-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(photographer.website_url!, '_blank');
                }}
              >
                <Globe className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Contact button for industry users */}
          {isIndustryUser && (
            <Button
              size="sm"
              variant="default"
              className="h-8"
              disabled={isContacting}
              onClick={(e) => {
                e.stopPropagation();
                onContact(photographer.id, photographer.email || '');
              }}
            >
              {isContacting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-1" />
                  Contact
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PhotographerCard;