
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, EyeOff, Eye, Calendar, MapPin, Star, Clock, CheckCircle2, XCircle, User, Mic } from 'lucide-react';
import { ApplicationData } from '@/services/applicationService';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isPast } from 'date-fns';

interface ApplicationCardProps {
  application: ApplicationData & {
    spot_assigned?: boolean;
    spot_name?: string;
    confirmation_status?: 'pending' | 'confirmed' | 'declined';
    confirmation_deadline?: string;
    confirmed_at?: string;
    declined_at?: string;
  };
  isSelected?: boolean;
  onSelect?: (applicationId: string, selected: boolean) => void;
  onApprove: (applicationId: string) => void;
  onHide: (applicationId: string) => void;
  onViewProfile: (comedianId: string) => void;
  onAssignSpot?: (applicationId: string) => void;
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
      case 'rejected': return 'bg-red-500 hover:bg-red-600';
      case 'withdrawn': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-yellow-500 hover:bg-yellow-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'withdrawn': return 'Withdrawn';
      default: return 'Pending';
    }
  };

  const getConfirmationStatusBadge = () => {
    if (!application.spot_assigned) return null;

    if (application.confirmation_status === 'confirmed') {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Confirmed
        </Badge>
      );
    }

    if (application.confirmation_status === 'declined') {
      return (
        <Badge className="bg-red-500 hover:bg-red-600 text-white">
          <XCircle className="w-3 h-3 mr-1" />
          Declined
        </Badge>
      );
    }

    if (application.confirmation_deadline) {
      const deadline = new Date(application.confirmation_deadline);
      const isOverdue = isPast(deadline);
      
      return (
        <Badge className={cn(
          "text-white",
          isOverdue ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
        )}>
          <Clock className="w-3 h-3 mr-1" />
          {isOverdue ? 'Overdue' : `Due ${formatDistanceToNow(deadline, { addSuffix: true })}`}
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
        <User className="w-3 h-3 mr-1" />
        Spot Assigned
      </Badge>
    );
  };

  const getSpotTypeBadge = () => {
    if (!application.spot_type) return null;
    
    const spotTypeColors: Record<string, string> = {
      'MC': 'bg-purple-500 hover:bg-purple-600',
      'Feature': 'bg-blue-500 hover:bg-blue-600',
      'Headliner': 'bg-indigo-500 hover:bg-indigo-600',
      'Guest': 'bg-teal-500 hover:bg-teal-600'
    };

    return (
      <Badge className={cn("text-white", spotTypeColors[application.spot_type] || 'bg-gray-500')}>
        <Mic className="w-3 h-3 mr-1" />
        {application.spot_type}
      </Badge>
    );
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
            
            <OptimizedAvatar
              src={application.comedian_avatar}
              name={application.comedian_name}
              className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-white/20"
              fallbackClassName="bg-purple-500 text-white text-sm sm:text-lg font-semibold"
            />
            
            {/* Mobile comedian info */}
            <div className="flex-1 sm:hidden">
              <h3 className="text-base font-semibold">{application.comedian_name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className={cn("text-xs", getStatusColor(application.status))}>
                  {getStatusText(application.status)}
                </Badge>
                {getSpotTypeBadge()}
                {application.comedian_experience && (
                  <span className="text-xs text-purple-200">• {application.comedian_experience}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {getConfirmationStatusBadge()}
                <span className="text-xs text-purple-200">Applied: {formatDate(application.applied_at)}</span>
              </div>
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
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                    🎭 {application.event_title}
                  </h4>
                  {application.spot_assigned && application.spot_name && (
                    <Badge className="bg-purple-500 hover:bg-purple-600 text-white text-xs">
                      {application.spot_name}
                    </Badge>
                  )}
                </div>
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

            {/* Application Details */}
            <div className="flex flex-wrap gap-2 text-xs">
              {application.availability_confirmed && (
                <Badge className="bg-green-600/20 text-green-200 border border-green-600/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Availability Confirmed
                </Badge>
              )}
              {application.requirements_acknowledged && (
                <Badge className="bg-blue-600/20 text-blue-200 border border-blue-600/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Requirements Acknowledged
                </Badge>
              )}
              {!application.availability_confirmed && (
                <Badge className="bg-yellow-600/20 text-yellow-200 border border-yellow-600/30">
                  <Clock className="w-3 h-3 mr-1" />
                  Availability Not Confirmed
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={cn("hidden sm:inline-flex", getStatusColor(application.status))}>
                  {getStatusText(application.status)}
                </Badge>
                {getSpotTypeBadge()}
                {getConfirmationStatusBadge()}
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {application.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onApprove(application.id)}
                      className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onHide(application.id)}
                      className="professional-button text-white border-white/30 hover:bg-white/10 flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                {application.status === 'accepted' && !application.spot_assigned && onAssignSpot && (
                  <Button
                    size="sm"
                    onClick={() => onAssignSpot(application.id)}
                    className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Assign Spot
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => onViewProfile(application.comedian_id)}
                  className="professional-button text-white border-white/30 hover:bg-white/10 flex-1 sm:flex-none text-xs sm:text-sm"
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
