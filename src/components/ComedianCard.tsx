
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MapPin, Mail, Calendar, Users, Instagram, Twitter, Youtube } from 'lucide-react';
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
    <Card className="bg-card/50 backdrop-blur-sm border-border hover:bg-card/70 transition-colors">
      <CardHeader className="pb-4">
        <div className="flex flex-col items-center space-y-3">
          <Avatar className="w-20 h-20">
            <AvatarImage src={comedian.avatar_url || undefined} />
            <AvatarFallback className="text-lg">
              {comedian.name?.charAt(0) || 'C'}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CardTitle className="text-lg">{comedian.name || 'Unknown'}</CardTitle>
            </div>
            {comedian.location && (
              <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                <MapPin className="w-3 h-3 mr-1" />
                {comedian.location}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {comedian.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {comedian.bio}
          </p>
        )}

        {/* Social Media Icons */}
        {socialMedia && (
          <div className="flex justify-center space-x-2">
            {socialMedia.instagram && (
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                <Instagram className="w-4 h-4 text-pink-500" />
              </Button>
            )}
            {socialMedia.tiktok && (
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                <img 
                  src="/lovable-uploads/86aec391-a232-4edd-857e-c3656212c77c.png" 
                  alt="TikTok" 
                  className="w-4 h-4"
                />
              </Button>
            )}
            {socialMedia.twitter && (
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                <Twitter className="w-4 h-4 text-blue-400" />
              </Button>
            )}
            {socialMedia.youtube && (
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                <Youtube className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-between text-xs text-muted-foreground">
          {comedian.years_experience && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {comedian.years_experience}y exp
            </div>
          )}
          {comedian.show_count && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {comedian.show_count} shows
            </div>
          )}
        </div>

        {/* Vouch System */}
        <div className="flex justify-center">
          <VouchButton 
            comedianId={comedian.id}
            comedianName={comedian.name || 'Unknown'}
            vouchCount={Math.floor(Math.random() * 5) + 1} // Mock vouch count
            hasVouched={false} // Mock vouch status
          />
        </div>

        {/* Only show contact button for industry users */}
        {isIndustryUser && (
          <Button
            size="sm"
            className="w-full"
            disabled={isContacting}
            onClick={() => onContact(comedian.id, comedian.email || '')}
          >
            {isContacting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Contact
          </Button>
        )}

        {/* For consumers, show a different action */}
        {!isIndustryUser && (
          <Button
            size="sm"
            className="w-full"
            variant="outline"
          >
            Follow Comedian
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ComedianCard;
