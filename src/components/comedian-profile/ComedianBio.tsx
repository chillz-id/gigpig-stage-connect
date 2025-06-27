
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, MapPin } from 'lucide-react';

interface ComedianBioProps {
  comedian: {
    id: string;
    name: string | null;
    bio: string | null;
    location: string | null;
    created_at?: string | null;
  };
}

const ComedianBio: React.FC<ComedianBioProps> = ({ comedian }) => {
  // Calculate years active (placeholder logic)
  const getYearsActive = () => {
    if (!comedian.created_at) return 'New to the scene';
    const createdYear = new Date(comedian.created_at).getFullYear();
    const currentYear = new Date().getFullYear();
    const years = currentYear - createdYear;
    return years > 0 ? `${years} year${years > 1 ? 's' : ''} active` : 'New to the scene';
  };

  if (!comedian.bio) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            About {comedian.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">
            No bio available yet. Check back soon for more information about this comedian.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          About {comedian.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bio Text */}
        <div className="prose prose-gray max-w-none">
          <p className="text-base leading-relaxed whitespace-pre-line">
            {comedian.bio}
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {getYearsActive()}
          </Badge>
          
          {comedian.location && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Based in {comedian.location}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianBio;
