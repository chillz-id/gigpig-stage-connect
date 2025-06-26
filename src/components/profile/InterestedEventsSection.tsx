
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface UserInterest {
  id: string;
  event_title: string;
  venue?: string;
  event_date?: string;
  event_time?: string;
}

interface InterestedEventsSectionProps {
  userInterests: UserInterest[];
}

export const InterestedEventsSection: React.FC<InterestedEventsSectionProps> = ({ userInterests }) => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Events I'm Interested In
        </CardTitle>
        <CardDescription>
          Events you've marked as interested
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {userInterests.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h4 className="text-lg font-semibold mb-2">No interested events yet</h4>
            <p className="text-muted-foreground">
              Browse events and mark ones you're interested in to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userInterests.map((interest) => (
              <div key={interest.id} className="border rounded-lg bg-background/50 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-medium">{interest.event_title}</h5>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {interest.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{interest.venue}</span>
                        </div>
                      )}
                      {interest.event_date && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{new Date(interest.event_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {interest.event_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{interest.event_time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-pink-400 text-pink-400 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-pink-400" />
                    Interested
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    View Event
                  </Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
