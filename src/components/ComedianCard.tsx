
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MapPin, Mail, Calendar, Users, Instagram, Twitter, Facebook, Youtube, Heart, UserPlus } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';

interface Comedian {
  id: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  email: string | null;
  years_experience?: number;
  show_count?: number;
  social_media?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
}

interface ComedianCardProps {
  comedian: Comedian;
  isContacting: boolean;
  onContact: (comedianId: string, comedianEmail: string) => void;
  onVouch?: (comedianId: string) => void;
  isVouched?: boolean;
}

const ComedianCard: React.FC<ComedianCardProps> = ({ 
  comedian, 
  isContacting, 
  onContact, 
  onVouch,
  isVouched = false 
}) => {
  const { isMemberView } = useViewMode();

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
        
        {comedian.social_media && Object.keys(comedian.social_media).length > 0 && (
          <div className="flex justify-center gap-2">
            {comedian.social_media.instagram && (
              <a href={comedian.social_media.instagram} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="p-2">
                  <Instagram className="w-4 h-4" />
                </Button>
              </a>
            )}
            {comedian.social_media.twitter && (
              <a href={comedian.social_media.twitter} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="p-2">
                  <Twitter className="w-4 h-4" />
                </Button>
              </a>
            )}
            {comedian.social_media.facebook && (
              <a href={comedian.social_media.facebook} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="p-2">
                  <Facebook className="w-4 h-4" />
                </Button>
              </a>
            )}
            {comedian.social_media.youtube && (
              <a href={comedian.social_media.youtube} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="p-2">
                  <Youtube className="w-4 h-4" />
                </Button>
              </a>
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

        <div className="space-y-2">
          {/* Member view - show both Vouch and Follow buttons */}
          {isMemberView && (
            <>
              {onVouch && (
                <Button
                  size="sm"
                  variant={isVouched ? "default" : "outline"}
                  className="w-full"
                  onClick={() => onVouch(comedian.id)}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isVouched ? 'fill-current' : ''}`} />
                  {isVouched ? 'Vouched' : 'Vouch'}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Follow Comedian
              </Button>
            </>
          )}

          {/* Industry view - show Contact button */}
          {!isMemberView && (
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianCard;
