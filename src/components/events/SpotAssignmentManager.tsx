import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  Filter, 
  GripVertical, 
  UserPlus, 
  Clock, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  Edit,
  CalendarClock,
  Loader2
} from 'lucide-react';
import { useEventSpots } from '@/hooks/useEventSpots';
import { useEventApplications } from '@/hooks/useEventApplications';
import { useSpotAssignment } from '@/hooks/useSpotAssignment';
import type { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';

interface SpotAssignmentManagerProps {
  eventId: string;
  onAssignmentChange?: () => void;
  onSpotAssigned?: (spotId: string) => void;
  preselectedComedianId?: string;
}

interface EventSpot extends Tables<'event_spots'> {
  confirmation_status?: string | null;
  confirmation_deadline?: string | null;
  confirmed_at?: string | null;
  declined_at?: string | null;
}

interface ApplicationWithProfile {
  id: string;
  comedian_id: string;
  event_id: string;
  status: string | null;
  message: string | null;
  spot_type: string | null;
  applied_at: string | null;
  responded_at: string | null;
  availability_confirmed: boolean | null;
  requirements_acknowledged: boolean | null;
  profiles?: {
    first_name?: string;
    last_name?: string;
    stage_name?: string;
    profile_picture?: string;
  };
}

const SpotAssignmentManager: React.FC<SpotAssignmentManagerProps> = ({ 
  eventId, 
  onAssignmentChange,
  onSpotAssigned,
  preselectedComedianId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [spotTypeFilter, setSpotTypeFilter] = useState<string>('all');
  const [selectedApplications, setSelectedApplications] = useState<string[]>(() => {
    // If a comedian is preselected, start with them selected
    if (preselectedComedianId) {
      return [];
    }
    return [];
  });
  const [draggedApplication, setDraggedApplication] = useState<ApplicationWithProfile | null>(null);
  const [draggedSpot, setDraggedSpot] = useState<EventSpot | null>(null);
  const [confirmationDeadlineHours, setConfirmationDeadlineHours] = useState<string>('48');
  const [assigningSpots, setAssigningSpots] = useState<Set<string>>(new Set());

  const { spots, isLoading: spotsLoading, updateSpot, refetch: refetchSpots } = useEventSpots(eventId);
  const { applications, isLoading: applicationsLoading } = useEventApplications(eventId);
  const { assignSpot, isAssigning } = useSpotAssignment();

  // Filter approved applications that are ready for assignment
  const approvedApplications = useMemo(() => {
    return (applications as ApplicationWithProfile[])
      .filter(app => {
        // If we have a preselected comedian, only show them
        if (preselectedComedianId) {
          return app.comedian_id === preselectedComedianId;
        }
        return app.status === 'accepted';
      })
      .filter(app => {
        if (statusFilter === 'assigned') return spots.some(spot => spot.comedian_id === app.comedian_id);
        if (statusFilter === 'unassigned') return !spots.some(spot => spot.comedian_id === app.comedian_id);
        return true;
      })
      .filter(app => {
        if (spotTypeFilter === 'all') return true;
        return app.spot_type === spotTypeFilter;
      })
      .filter(app => {
        if (!searchTerm) return true;
        const profileName = app.profiles?.stage_name || 
          `${app.profiles?.first_name || ''} ${app.profiles?.last_name || ''}`.trim();
        return profileName.toLowerCase().includes(searchTerm.toLowerCase());
      });
  }, [applications, spots, statusFilter, spotTypeFilter, searchTerm, preselectedComedianId]);

  // Group spots by filled/unfilled status
  const { filledSpots, unfilledSpots } = useMemo(() => {
    const filled = spots.filter(spot => spot.is_filled && spot.comedian_id);
    const unfilled = spots.filter(spot => !spot.is_filled || !spot.comedian_id);
    return { filledSpots: filled, unfilledSpots: unfilled };
  }, [spots]);

  // Get comedian info for assigned spots
  const getComedianForSpot = (spot: EventSpot) => {
    if (!spot.comedian_id) return null;
    return approvedApplications.find(app => app.comedian_id === spot.comedian_id);
  };

  const handleAssignToSpot = async (spotId: string, application: ApplicationWithProfile) => {
    if (assigningSpots.has(spotId)) return;
    
    setAssigningSpots(prev => new Set(prev).add(spotId));
    
    try {
      // Use the RPC function to assign spot
      await assignSpot({
        eventId,
        comedianId: application.comedian_id,
        spotType: application.spot_type || 'Spot',
        confirmationDeadlineHours: parseInt(confirmationDeadlineHours)
      });
      
      // Refetch spots to get updated confirmation status
      await refetchSpots();
      
      toast.success(`Comedian assigned to spot with ${confirmationDeadlineHours}hr confirmation deadline`);
      onAssignmentChange?.();
      onSpotAssigned?.(spotId);
    } catch (error) {
      toast.error('Failed to assign comedian to spot');
      console.error('Assignment error:', error);
    } finally {
      setAssigningSpots(prev => {
        const next = new Set(prev);
        next.delete(spotId);
        return next;
      });
    }
  };

  const handleRemoveFromSpot = async (spotId: string) => {
    try {
      await updateSpot({
        id: spotId,
        comedian_id: null,
        is_filled: false,
        updated_at: new Date().toISOString()
      });
      
      toast.success('Comedian removed from spot');
      onAssignmentChange?.();
    } catch (error) {
      toast.error('Failed to remove comedian from spot');
      console.error('Removal error:', error);
    }
  };

  const handleBulkAssign = async (selectedApps: string[]) => {
    const availableSpots = unfilledSpots.slice(0, selectedApps.length);
    
    if (availableSpots.length === 0) {
      toast.error('No available spots for assignment');
      return;
    }

    if (selectedApps.length > availableSpots.length) {
      toast.error(`Only ${availableSpots.length} spots available, but ${selectedApps.length} comedians selected`);
      return;
    }

    try {
      await Promise.all(
        selectedApps.map(async (appId) => {
          const application = approvedApplications.find(app => app.id === appId);
          if (application) {
            await assignSpot({
              eventId,
              comedianId: application.comedian_id,
              spotType: application.spot_type || 'Spot',
              confirmationDeadlineHours: parseInt(confirmationDeadlineHours)
            });
          }
        })
      );
      
      await refetchSpots();
      
      toast.success(`${selectedApps.length} comedians assigned with ${confirmationDeadlineHours}hr confirmation deadline`);
      setSelectedApplications([]);
      onAssignmentChange?.();
    } catch (error) {
      toast.error('Failed to bulk assign comedians');
      console.error('Bulk assignment error:', error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: ApplicationWithProfile | EventSpot, type: 'application' | 'spot') => {
    if (type === 'application') {
      setDraggedApplication(item as ApplicationWithProfile);
    } else {
      setDraggedSpot(item as EventSpot);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnSpot = (e: React.DragEvent, targetSpot: EventSpot) => {
    e.preventDefault();
    
    if (draggedApplication && !targetSpot.is_filled) {
      handleAssignToSpot(targetSpot.id, draggedApplication);
    }
    
    setDraggedApplication(null);
    setDraggedSpot(null);
  };

  const handleDropOnApplication = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedSpot && draggedSpot.comedian_id) {
      handleRemoveFromSpot(draggedSpot.id);
    }
    
    setDraggedApplication(null);
    setDraggedSpot(null);
  };

  const getDisplayName = (application: ApplicationWithProfile) => {
    return application.profiles?.stage_name || 
      `${application.profiles?.first_name || ''} ${application.profiles?.last_name || ''}`.trim() ||
      'Unknown Comedian';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConfirmationStatusBadge = (spot: EventSpot) => {
    if (!spot.comedian_id) return null;
    
    switch (spot.confirmation_status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case 'declined':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        );
      case 'pending':
        const deadline = spot.confirmation_deadline ? new Date(spot.confirmation_deadline) : null;
        const isPastDeadline = deadline && deadline < new Date();
        return (
          <Badge className={isPastDeadline ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
            <Clock className="w-3 h-3 mr-1" />
            {isPastDeadline ? 'Expired' : `Pending (${format(deadline, 'MMM d, h:mm a')})`}
          </Badge>
        );
      default:
        return null;
    }
  };

  if (spotsLoading || applicationsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Spot Assignment Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          {preselectedComedianId && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Assigning spot to the selected comedian. Drag them to an available spot or select spots and click assign.
              </p>
            </div>
          )}
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search">Search Comedians</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-48">
              <Label htmlFor="status-filter">Assignment Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Approved</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Label htmlFor="spot-type-filter">Spot Type</Label>
              <Select value={spotTypeFilter} onValueChange={setSpotTypeFilter}>
                <SelectTrigger id="spot-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="MC">MC</SelectItem>
                  <SelectItem value="Feature">Feature</SelectItem>
                  <SelectItem value="Headliner">Headliner</SelectItem>
                  <SelectItem value="Guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Confirmation Deadline Setting */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="deadline-hours" className="text-sm font-medium mb-2 block">
              Confirmation Deadline for New Assignments
            </Label>
            <div className="flex items-center gap-2">
              <Select value={confirmationDeadlineHours} onValueChange={setConfirmationDeadlineHours}>
                <SelectTrigger id="deadline-hours" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours (default)</SelectItem>
                  <SelectItem value="72">72 hours</SelectItem>
                  <SelectItem value="96">4 days</SelectItem>
                  <SelectItem value="120">5 days</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">
                <CalendarClock className="w-4 h-4 inline mr-1" />
                Comedians must confirm within this time
              </span>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedApplications.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg mb-6">
              <span className="text-sm font-medium">
                {selectedApplications.length} comedian{selectedApplications.length !== 1 ? 's' : ''} selected
              </span>
              <Button
                size="sm"
                onClick={() => handleBulkAssign(selectedApplications)}
                disabled={unfilledSpots.length === 0 || isAssigning}
              >
                {isAssigning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Assign to Available Spots
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedApplications([])}
              >
                Clear Selection
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Spots */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Event Spots ({spots.length})</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{filledSpots.length} filled</span>
                  <span>•</span>
                  <span>{unfilledSpots.length} available</span>
                </div>
              </div>
              
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {spots.map((spot, index) => {
                    const assignedComedian = getComedianForSpot(spot);
                    const isAssigned = spot.is_filled && assignedComedian;
                    
                    return (
                      <div
                        key={spot.id}
                        className={`p-4 rounded-lg border-2 border-dashed transition-all ${
                          isAssigned 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-300 bg-gray-50 hover:border-blue-300'
                        }`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnSpot(e, spot)}
                        draggable={isAssigned}
                        onDragStart={(e) => {
                          if (isAssigned) {
                            handleDragStart(e, spot, 'spot');
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isAssigned && <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />}
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">#{index + 1}</Badge>
                                <span className="font-medium">{spot.spot_name}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {spot.duration_minutes}min
                                </span>
                                {spot.is_paid && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    {spot.currency} {spot.payment_amount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isAssigned ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-yellow-500" />
                            )}
                          </div>
                        </div>
                        
                        {isAssigned && assignedComedian && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <OptimizedAvatar
                                  src={assignedComedian.profiles?.profile_picture}
                                  name={getDisplayName(assignedComedian)}
                                  className="w-8 h-8"
                                />
                                <div>
                                  <p className="font-medium">{getDisplayName(assignedComedian)}</p>
                                  <p className="text-sm text-gray-600">{assignedComedian.spot_type}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleRemoveFromSpot(spot.id)}
                                disabled={assigningSpots.has(spot.id)}
                              >
                                {assigningSpots.has(spot.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            {getConfirmationStatusBadge(spot)}
                          </div>
                        )}
                        
                        {!isAssigned && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-500 text-center">
                              {assigningSpots.has(spot.id) ? (
                                <span className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Assigning...
                                </span>
                              ) : (
                                'Drag a comedian here to assign'
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Approved Applications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Approved Applications ({approvedApplications.length})
                </h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (selectedApplications.length === approvedApplications.length) {
                      setSelectedApplications([]);
                    } else {
                      setSelectedApplications(approvedApplications.map(app => app.id));
                    }
                  }}
                >
                  {selectedApplications.length === approvedApplications.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <ScrollArea className="h-96">
                <div 
                  className="space-y-2 min-h-full"
                  onDragOver={handleDragOver}
                  onDrop={handleDropOnApplication}
                >
                  {approvedApplications.map((application) => {
                    const isAssigned = spots.some(spot => spot.comedian_id === application.comedian_id);
                    const isSelected = selectedApplications.includes(application.id);
                    
                    return (
                      <div
                        key={application.id}
                        className={`p-4 rounded-lg border cursor-move transition-all ${
                          isAssigned 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-300 bg-white hover:border-blue-300'
                        } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                        draggable={!isAssigned}
                        onDragStart={(e) => {
                          if (!isAssigned) {
                            handleDragStart(e, application, 'application');
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedApplications([...selectedApplications, application.id]);
                                } else {
                                  setSelectedApplications(selectedApplications.filter(id => id !== application.id));
                                }
                              }}
                            />
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <OptimizedAvatar
                              src={application.profiles?.profile_picture}
                              name={getDisplayName(application)}
                              className="w-10 h-10"
                            />
                            <div>
                              <p className="font-medium">{getDisplayName(application)}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Badge
                                  className={`${getStatusColor(application.status || 'pending')} text-white`}
                                >
                                  {application.spot_type}
                                </Badge>
                                {isAssigned && (
                                  <span className="text-blue-600 font-medium">Assigned</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isAssigned ? (
                              <CheckCircle className="w-5 h-5 text-blue-500" />
                            ) : (
                              <UserPlus className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        {application.message && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {application.message}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {approvedApplications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No approved applications found</p>
                      <p className="text-sm">Applications will appear here once they're approved</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpotAssignmentManager;