
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Mail, Instagram, Twitter, Youtube } from 'lucide-react';
import VouchButton from './VouchButton';
import { Comedian } from '@/types/comedian';
import { useAuth } from '@/contexts/AuthContext';

interface ComedianCardProps {
  comedian: Comedian;
  isContacting: boolean;
  onContact: (comedianId: string, comedianEmail: string) => void;
}

const ComedianCard: React.FC<ComedianCardProps> = ({ comedian, isContacting, onContact }) => {
  const { user, hasRole } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // Mock social media data for demonstration
  const mockSocialMedia = {
    instagram: '@sarahmitchell_comedy',
    tiktok: '@sarahcomedy',
    twitter: '@sarahmitchell',
    youtube: 'Sarah Mitchell Comedy'
  };

  const socialMedia = comedian.social_media || mockSocialMedia;
  const isIndustryUser = user && (hasRole('comedian') || hasRole('promoter') || hasRole('admin'));

  return (
    <Card 
      className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={comedian.avatar_url || 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=600&fit=crop'} 
          alt={comedian.name || 'Comedian'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=400&h=600&fit=crop';
          }}
        />
      </div>

      {/* Gradient Overlay - shows on hover */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-70'
      }`} />

      {/* Vouch Button - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <VouchButton 
          comedianId={comedian.id}
          comedianName={comedian.name || 'Unknown'}
          vouchCount={Math.floor(Math.random() * 5) + 1} // Mock vouch count
          hasVouched={false} // Mock vouch status
          variant="icon"
        />
      </div>

      {/* Content at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        {/* Name and Location */}
        <div className="mb-3">
          <h3 className="text-xl font-bold">{comedian.name || 'Unknown'}</h3>
          {comedian.location && (
            <div className="flex items-center text-sm opacity-90 mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {comedian.location}
            </div>
          )}
        </div>

        {/* Social Media and Contact Button Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {socialMedia.instagram && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-8 h-8 p-0 hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://instagram.com/${socialMedia.instagram.replace('@', '')}`, '_blank');
                }}
              >
                <Instagram className="w-4 h-4 text-pink-500" />
              </Button>
            )}
            {socialMedia.tiktok && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-8 h-8 p-0 hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://tiktok.com/@${socialMedia.tiktok.replace('@', '')}`, '_blank');
                }}
              >
                <img 
                  src="/lovable-uploads/86aec391-a232-4edd-857e-c3656212c77c.png" 
                  alt="TikTok" 
                  className="w-4 h-4"
                />
              </Button>
            )}
            {socialMedia.twitter && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-8 h-8 p-0 hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://twitter.com/${socialMedia.twitter.replace('@', '')}`, '_blank');
                }}
              >
                <Twitter className="w-4 h-4 text-blue-400" />
              </Button>
            )}
            {socialMedia.youtube && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-8 h-8 p-0 hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://youtube.com/@${socialMedia.youtube}`, '_blank');
                }}
              >
                <Youtube className="w-4 h-4 text-red-500" />
              </Button>
            )}
            
            {/* Contact button for industry users */}
            {isIndustryUser && (
              <Button
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 hover:bg-white/20 ml-1"
                disabled={isContacting}
                onClick={(e) => {
                  e.stopPropagation();
                  onContact(comedian.id, comedian.email || '');
                }}
              >
                {isContacting ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ComedianCard;
