import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Clock, MapPin, Users, DollarSign } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type EventTemplate = Tables<'event_templates'>;

interface EventTemplatePreviewProps {
  template: EventTemplate;
  onLoad?: () => void;
}

interface TemplateData {
  title?: string;
  venue?: string;
  address?: string;
  description?: string;
  time?: string;
  endTime?: string;
  spots?: number | any[];
  capacity?: number;
  isPaid?: boolean;
  imageUrl?: string;
  bannerUrl?: string;
  showLevel?: string;
  showType?: string;
  ageRestriction?: string;
  dresscode?: string;
  requirements?: string[];
}

export const EventTemplatePreview: React.FC<EventTemplatePreviewProps> = ({
  template,
  onLoad
}) => {
  const data = template.template_data as TemplateData;
  const bannerUrl = data.imageUrl || data.bannerUrl;
  const spotsCount = Array.isArray(data.spots) ? data.spots.length : (data.spots || 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="p-1">
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Template Preview: {template.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Banner Preview */}
          {bannerUrl && (
            <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={bannerUrl} 
                alt="Template banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {data.title || 'Untitled Event'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Venue & Location */}
              {data.venue && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{data.venue}</span>
                  {data.address && (
                    <span className="text-gray-400">• {data.address}</span>
                  )}
                </div>
              )}

              {/* Time */}
              {data.time && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {data.time}
                    {data.endTime && ` - ${data.endTime}`}
                  </span>
                </div>
              )}

              {/* Capacity & Spots */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {spotsCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{spotsCount} comedy spots</span>
                  </div>
                )}
                {data.capacity && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {data.capacity}</span>
                  </div>
                )}
                {data.isPaid && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>Paid event</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {data.description && (
                <div className="text-sm text-gray-700">
                  <p className="line-clamp-3">{data.description}</p>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {data.showLevel && (
                  <Badge variant="secondary">{data.showLevel}</Badge>
                )}
                {data.showType && (
                  <Badge variant="outline">{data.showType}</Badge>
                )}
                {data.ageRestriction && (
                  <Badge variant="outline">{data.ageRestriction}</Badge>
                )}
                {data.dresscode && (
                  <Badge variant="outline">{data.dresscode}</Badge>
                )}
              </div>

              {/* Requirements */}
              {data.requirements && data.requirements.length > 0 && (
                <div className="text-sm">
                  <h4 className="font-medium text-gray-700 mb-1">Requirements:</h4>
                  <ul className="text-gray-600 space-y-1">
                    {data.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-gray-400">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Load Template Button */}
              {onLoad && (
                <div className="pt-2 border-t">
                  <Button onClick={onLoad} className="w-full">
                    Use This Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};