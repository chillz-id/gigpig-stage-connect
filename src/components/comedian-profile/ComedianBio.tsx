
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

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
  if (!comedian.bio) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Bio
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
          Bio
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Bio Text */}
        <div className="prose prose-gray max-w-none">
          <p className="text-base leading-relaxed whitespace-pre-line">
            {comedian.bio}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianBio;
