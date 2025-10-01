import React, { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow, isPast, addHours } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, AlertCircle, CheckCircle, XCircle, Timer, Calendar, RefreshCw } from 'lucide-react';
import { deadlineMonitoringService } from '@/services/deadlineMonitoringService';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DeadlineStats {
  total_pending: number;
  expiring_24h: number;
  expiring_6h: number;
  expired_today: number;
  confirmed_today: number;
}

interface SpotWithDeadline {
  id: string;
  spot_name: string;
  confirmation_status: string;
  confirmation_deadline: string | null;
  comedian_id: string | null;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    stage_name?: string;
  };
}

interface EventWithSpots {
  id: string;
  title: string;
  event_date: string;
  event_spots: SpotWithDeadline[];
}

interface ExtensionDialogState {
  open: boolean;
  spotId: string | null;
  spotName: string;
  eventTitle: string;
  currentDeadline: Date | null;
}

export function DeadlineMonitoringDashboard({ promoterId }: { promoterId: string }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DeadlineStats>({
    total_pending: 0,
    expiring_24h: 0,
    expiring_6h: 0,
    expired_today: 0,
    confirmed_today: 0
  });
  const [events, setEvents] = useState<EventWithSpots[]>([]);
  const [activeTab, setActiveTab] = useState('urgent');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();

  // Extension dialog state
  const [extensionDialog, setExtensionDialog] = useState<ExtensionDialogState>({
    open: false,
    spotId: null,
    spotName: '',
    eventTitle: '',
    currentDeadline: null
  });
  const [newDeadline, setNewDeadline] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [extending, setExtending] = useState(false);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      const data = await deadlineMonitoringService.getMonitoringDashboard(promoterId);
      setStats(data.stats);
      setEvents(data.events || []);
      setLastUpdated(new Date(data.lastUpdated));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deadline monitoring data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [promoterId, toast]);

  useEffect(() => {
    loadDashboard();

    // Refresh every 2 minutes
    const interval = setInterval(loadDashboard, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleExtendDeadline = async () => {
    if (!extensionDialog.spotId || !newDeadline) return;

    setExtending(true);
    try {
      const success = await deadlineMonitoringService.extendDeadline(
        extensionDialog.spotId,
        new Date(newDeadline),
        promoterId,
        extensionReason
      );

      if (success) {
        toast({
          title: 'Deadline Extended',
          description: 'The confirmation deadline has been successfully extended'
        });
        setExtensionDialog({ open: false, spotId: null, spotName: '', eventTitle: '', currentDeadline: null });
        setNewDeadline('');
        setExtensionReason('');
        loadDashboard();
      } else {
        throw new Error('Failed to extend deadline');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to extend deadline',
        variant: 'destructive'
      });
    } finally {
      setExtending(false);
    }
  };

  const openExtensionDialog = (spot: SpotWithDeadline, eventTitle: string) => {
    const currentDeadline = spot.confirmation_deadline ? new Date(spot.confirmation_deadline) : null;
    setExtensionDialog({
      open: true,
      spotId: spot.id,
      spotName: spot.spot_name,
      eventTitle,
      currentDeadline
    });
    
    // Set default new deadline to current + 24 hours
    if (currentDeadline) {
      setNewDeadline(format(addHours(currentDeadline, 24), "yyyy-MM-dd'T'HH:mm"));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'declined':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
      case 'expired':
        return <Badge variant="outline"><Timer className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeadlineColor = (deadline: string | null) => {
    if (!deadline) return '';
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const hoursUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (isPast(deadlineDate)) return 'text-red-600';
    if (hoursUntil <= 6) return 'text-orange-600';
    if (hoursUntil <= 24) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filterSpotsByUrgency = (spots: SpotWithDeadline[], filter: string) => {
    const now = new Date();
    const in6h = addHours(now, 6);
    const in24h = addHours(now, 24);

    return spots.filter(spot => {
      if (spot.confirmation_status !== 'pending') return false;
      if (!spot.confirmation_deadline) return false;
      
      const deadline = new Date(spot.confirmation_deadline);
      
      switch (filter) {
        case 'urgent':
          return deadline <= in6h && !isPast(deadline);
        case 'today':
          return deadline <= in24h && !isPast(deadline);
        case 'expired':
          return spot.confirmation_status === 'expired' || isPast(deadline);
        case 'all':
          return true;
        default:
          return false;
      }
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deadline Monitoring</h2>
          <p className="text-muted-foreground">
            Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          size="sm"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Expiring in 6h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiring_6h}</div>
            <p className="text-xs text-muted-foreground">Urgent attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Expiring in 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiring_24h}</div>
            <p className="text-xs text-muted-foreground">Need follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Expired Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired_today}</div>
            <p className="text-xs text-muted-foreground">Need reassignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Confirmed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed_today}</div>
            <p className="text-xs text-muted-foreground">Successfully confirmed</p>
          </CardContent>
        </Card>
      </div>

      {/* Deadline Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="urgent">Urgent (6h)</TabsTrigger>
          <TabsTrigger value="today">Today (24h)</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="all">All Pending</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {events.map(event => {
                const filteredSpots = filterSpotsByUrgency(event.event_spots || [], activeTab);
                
                if (filteredSpots.length === 0) return null;

                return (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.event_date), 'PPP')}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">{filteredSpots.length} spots</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {filteredSpots.map(spot => (
                          <div key={spot.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{spot.spot_name}</span>
                                {getStatusBadge(spot.confirmation_status)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {spot.profiles ? (
                                  <span>
                                    Assigned to: {spot.profiles.stage_name || 
                                    `${spot.profiles.first_name} ${spot.profiles.last_name}`}
                                  </span>
                                ) : (
                                  <span className="text-red-600">No comedian assigned</span>
                                )}
                              </div>
                              {spot.confirmation_deadline && (
                                <div className={cn("text-sm flex items-center gap-1", getDeadlineColor(spot.confirmation_deadline))}>
                                  <Clock className="h-3 w-3" />
                                  Deadline: {format(new Date(spot.confirmation_deadline), 'PPP p')}
                                  <span className="text-xs">
                                    ({formatDistanceToNow(new Date(spot.confirmation_deadline), { addSuffix: true })})
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {spot.confirmation_status === 'pending' && spot.confirmation_deadline && !isPast(new Date(spot.confirmation_deadline)) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openExtensionDialog(spot, event.title)}
                                >
                                  Extend Deadline
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Extension Dialog */}
      <Dialog open={extensionDialog.open} onOpenChange={(open) => !extending && setExtensionDialog({ ...extensionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Confirmation Deadline</DialogTitle>
            <DialogDescription>
              Extend the deadline for {extensionDialog.spotName} at "{extensionDialog.eventTitle}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {extensionDialog.currentDeadline && (
              <div className="text-sm">
                <span className="text-muted-foreground">Current deadline:</span>{' '}
                <span className="font-medium">
                  {format(extensionDialog.currentDeadline, 'PPP p')}
                </span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="new-deadline">New Deadline</Label>
              <Input
                id="new-deadline"
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Provide a reason for the extension..."
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExtensionDialog({ open: false, spotId: null, spotName: '', eventTitle: '', currentDeadline: null })}
              disabled={extending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendDeadline}
              disabled={!newDeadline || extending}
            >
              {extending ? 'Extending...' : 'Extend Deadline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
