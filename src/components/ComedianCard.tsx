
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MapPin, Mail, Calendar, Users } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';
import VouchButton from './VouchButton';

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
  specialties?: string[];
}

interface ComedianCardProps {
  comedian: Comedian;
  isContacting: boolean;
  onContact: (comedianId: string, comedianEmail: string) => void;
}

const ComedianCard: React.FC<ComedianCardProps> = ({ comedian, isContacting, onContact }) => {
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
        
        {comedian.specialties && comedian.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {comedian.specialties.slice(0, 3).map((specialty, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
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

        {/* Only show contact button for industry users, not members */}
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

        {/* For members, show a different action */}
        {isMemberView && (
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
