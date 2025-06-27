
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X, Eye, Calendar, Clock, MapPin, Star } from 'lucide-react';

interface ApplicationCardProps {
  application: {
    id: string;
    comedian_id: string;
    comedian_name: string;
    comedian_avatar?: string;
    comedian_experience?: string;
    comedian_rating?: number;
    event_id: string;
    event_title: string;
    event_venue: string;
    event_date: string;
    applied_at: string;
    status: 'pending' | 'accepted' | 'declined';
    message?: string;
  };
  isSelected?: boolean;
  onSelect?: (applicationId: string, selected: boolean) => void;
  onApprove: (applicationId: string) => void;
  onReject: (applicationId: string) => void;
  onViewProfile: (comedianId: string) => void;
  showEventDetails?: boolean;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  isSelected = false,
  onSelect,
  onApprove,
  onReject,
  onViewProfile,
  showEventDetails = true,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500 hover:bg-green-600';
      case 'declined': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-yellow-500 hover:bg-yellow-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Approved';
      case 'declined': return 'Rejected';
      default: return 'Pending';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {onSelect && (
            <div className="flex items-center pt-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(application.id, checked as boolean)}
                className="border-white/30 data-[state=checked]:bg-purple-500"
              />
            </div>
          )}
          
          <Avatar className="w-16 h-16 border-2 border-white/20">
            <AvatarImage src={application.comedian_avatar} alt={application.comedian_name} />
            <AvatarFallback className="bg-purple-500 text-white text-lg font-semibold">
              {application.comedian_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            {/* Comedian Info */}
            <div>
              <h3 className="text-lg font-semibold mb-1">{application.comedian_name}</h3>
              <div className="flex items-center gap-4 text-sm text-purple-200">
                {application.comedian_experience && (
                  <span>Experience: {application.comedian_experience}</span>
                )}
                {application.comedian_rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current text-yellow-400" />
                    <span>{application.comedian_rating}★</span>
                  </div>
                )}
                <span>Applied: {formatDate(application.applied_at)}</span>
              </div>
            </div>

            {/* Event Details */}
            {showEventDetails && (
              <div className="bg-white/5 p-3 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  🎭 {application.event_title}
                </h4>
                <div className="flex items-center gap-4 text-sm text-purple-200">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(application.event_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{application.event_venue}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Application Message */}
            {application.message && (
              <div className="bg-white/5 p-3 rounded-lg">
                <p className="text-sm text-purple-100 italic">
                  "{application.message.length > 150 
                    ? `${application.message.slice(0, 150)}...` 
                    : application.message}"
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(application.status)}>
                {getStatusText(application.status)}
              </Badge>

              <div className="flex gap-2">
                {application.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onApprove(application.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onReject(application.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewProfile(application.comedian_id)}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
