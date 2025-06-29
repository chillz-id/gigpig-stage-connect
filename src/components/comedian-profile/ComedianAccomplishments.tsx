
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface ComedianAccomplishmentsProps {
  comedianId: string;
}

const ComedianAccomplishments: React.FC<ComedianAccomplishmentsProps> = ({ comedianId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Accomplishments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground py-8">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Awards and accomplishments coming soon...</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianAccomplishments;
