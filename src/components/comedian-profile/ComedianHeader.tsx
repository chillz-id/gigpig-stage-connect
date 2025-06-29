
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, MapPin, Share2, Instagram, Twitter, Youtube, Facebook } from 'lucide-react';

interface ComedianHeaderProps {
  comedian: {
    id: string;
    name: string | null;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    email: string | null;
  };
  onShare: () => void;
}

const ComedianHeader: React.FC<ComedianHeaderProps> = ({ comedian, onShare }) => {
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleContact = () => {
    if (comedian.email) {
      window.location.href = `mailto:${comedian.email}?subject=Booking Inquiry from Stand Up Sydney`;
    }
  };

  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Profile Picture */}
          <Avatar className="w-32 h-32">
            <AvatarImage src={comedian.avatar_url || ''} alt={comedian.name || 'Comedian'} />
            <AvatarFallback className="text-2xl font-bold">
              {getInitials(comedian.name)}
            </AvatarFallback>
          </Avatar>
          
          {/* Comedian Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <h1 className="text-3xl font-bold">{comedian.name || 'Unknown Comedian'}</h1>
              {comedian.is_verified && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Verified
                </Badge>
              )}
            </div>
            
            {/* Location */}
            {comedian.location && (
              <div className="flex items-center justify-center md:justify-start gap-1 mb-4 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{comedian.location}</span>
              </div>
            )}
            
            {/* Quick tagline - extracted from first line of bio */}
            {comedian.bio && (
              <p className="text-lg text-muted-foreground mb-6 max-w-md">
                {comedian.bio.split('\n')[0].substring(0, 100)}
                {comedian.bio.split('\n')[0].length > 100 ? '...' : ''}
              </p>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {comedian.email && (
                <Button onClick={handleContact} className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Contact for Booking
                </Button>
              )}
              
              <Button variant="outline" onClick={onShare} className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Profile
              </Button>
            </div>
            
            {/* Social Media Icons - Placeholder for now */}
            <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Youtube className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <Facebook className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianHeader;
