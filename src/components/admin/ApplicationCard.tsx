
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, EyeOff, Eye, Calendar, MapPin, Star } from 'lucide-react';
import { ApplicationData } from '@/services/applicationService';
import { cn } from '@/lib/utils';

interface ApplicationCardProps {
  application: ApplicationData;
  isSelected?: boolean;
  onSelect?: (applicationId: string, selected: boolean) => void;
  onApprove: (applicationId: string) => void;
  onHide: (applicationId: string) => void;
  onViewProfile: (comedianId: string) => void;
  showEventDetails?: boolean;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  isSelected = false,
  onSelect,
  onApprove,
  onHide,
  onViewProfile,
  showEventDetails = true,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500 hover:bg-green-600';
      case 'declined': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-yellow-500 hover:bg-yellow-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Approved';
      case 'declined': return 'Hidden';
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
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {onSelect && (
              <div className="flex items-center">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(application.id, checked as boolean)}
                  className="border-white/30 data-[state=checked]:bg-purple-500"
                />
              </div>
            )}
            
            <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-white/20">
              <AvatarImage src={application.comedian_avatar} alt={application.comedian_name} />
              <AvatarFallback className="bg-purple-500 text-white text-sm sm:text-lg font-semibold">
                {application.comedian_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            {/* Mobile comedian info */}
            <div className="flex-1 sm:hidden">
              <h3 className="text-base font-semibold">{application.comedian_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("text-xs", getStatusColor(application.status))}>
                  {getStatusText(application.status)}
                </Badge>
                {application.comedian_experience && (
                  <span className="text-xs text-purple-200">• {application.comedian_experience}</span>
                )}
              </div>
              <span className="text-xs text-purple-200">Applied: {formatDate(application.applied_at)}</span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {/* Comedian Info - Desktop only */}
            <div className="hidden sm:block">
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
                <h4 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                  🎭 {application.event_title}
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-purple-200">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{new Date(application.event_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate max-w-[150px] sm:max-w-none">{application.event_venue}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Application Message */}
            {application.message && (
              <div className="bg-white/5 p-3 rounded-lg">
                <p className="text-xs sm:text-sm text-purple-100 italic">
                  "{application.message.length > 100 
                    ? `${application.message.slice(0, 100)}...` 
                    : application.message}"
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <Badge className={cn("hidden sm:inline-flex", getStatusColor(application.status))}>
                {getStatusText(application.status)}
              </Badge>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {application.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onApprove(application.id)}
                      className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onHide(application.id)}
                      className="text-white border-white/30 hover:bg-white/10 flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Hide
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewProfile(application.comedian_id)}
                  className="text-white border-white/30 hover:bg-white/10 flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
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
