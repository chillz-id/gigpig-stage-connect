/**
 * AssignComedianDialog Component
 *
 * Dialog for assigning a comedian to a spot.
 * - Shows shortlisted/confirmed comedians by default
 * - Search can find ANY comedian on the platform
 * - Non-shortlisted comedians get sent an offer instead of direct assignment
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Search, UserPlus, X, Send, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAssignComedianToSpot, useUnassignComedianFromSpot } from '@/hooks/useEventSpots';
import { useToast } from '@/hooks/use-toast';

interface AssignComedianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  spotId: string;
  currentComedianId?: string;
}

interface ComedianOption {
  id: string;
  comedian_id: string;
  comedian_name: string;
  comedian_avatar?: string;
  status: 'accepted' | 'shortlisted' | 'platform'; // platform = not applied/shortlisted
  applicationId?: string;
}

export function AssignComedianDialog({
  open,
  onOpenChange,
  eventId,
  spotId,
  currentComedianId,
}: AssignComedianDialogProps) {
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const assignToSpot = useAssignComedianToSpot();
  const unassignFromSpot = useUnassignComedianFromSpot();

  // Fetch confirmed and shortlisted applications for this event
  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['assignable-comedians', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          comedian_id,
          status,
          comedian:profiles!applications_comedian_id_fkey (
            id,
            stage_name,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .in('status', ['accepted', 'shortlisted'])
        .order('status', { ascending: true });

      if (error) throw error;

      return (data || []).map((app: any) => ({
        id: app.id,
        comedian_id: app.comedian_id,
        comedian_name: app.comedian?.stage_name || 'Unknown',
        comedian_avatar: app.comedian?.avatar_url,
        status: app.status as 'accepted' | 'shortlisted',
        applicationId: app.id,
      })) as ComedianOption[];
    },
    enabled: open,
  });

  // Search all comedians on the platform (only when search is active)
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search-all-comedians', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url')
        .eq('user_type', 'comedian')
        .ilike('stage_name', `%${search}%`)
        .limit(20);

      if (error) throw error;

      return (data || []).map((profile: any) => ({
        id: profile.id,
        comedian_id: profile.id,
        comedian_name: profile.stage_name || 'Unknown',
        comedian_avatar: profile.avatar_url,
        status: 'platform' as const,
      })) as ComedianOption[];
    },
    enabled: open && search.length >= 2,
  });

  // Send offer mutation (creates an application with 'invited' status)
  const sendOfferMutation = useMutation({
    mutationFn: async (comedianId: string) => {
      // Check if application already exists
      const { data: existing } = await supabase
        .from('applications')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('comedian_id', comedianId)
        .single();

      if (existing) {
        throw new Error(`This comedian already has a ${existing.status} application`);
      }

      // Create invitation application
      const { data, error } = await supabase
        .from('applications')
        .insert({
          event_id: eventId,
          comedian_id: comedianId,
          status: 'invited',
          applied_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Offer Sent',
        description: 'An invitation has been sent to the comedian.',
      });
      queryClient.invalidateQueries({ queryKey: ['assignable-comedians', eventId] });
      queryClient.invalidateQueries({ queryKey: ['applications', eventId] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to send offer',
        description: error.message,
      });
    },
  });

  // Filter applications by search
  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    if (!search) return applications;
    return applications.filter((app) =>
      app.comedian_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [applications, search]);

  // Filter search results to exclude already shortlisted/confirmed comedians
  const filteredSearchResults = useMemo(() => {
    if (!searchResults) return [];
    const existingIds = new Set(applications?.map((a) => a.comedian_id) || []);
    return searchResults.filter((r) => !existingIds.has(r.comedian_id));
  }, [searchResults, applications]);

  const isLoading = appsLoading || (search.length >= 2 && searchLoading);

  const handleAssign = (comedianId: string) => {
    assignToSpot.mutate(
      { spotId, comedianId, eventId },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleSendOffer = (comedianId: string) => {
    sendOfferMutation.mutate(comedianId);
  };

  const handleUnassign = () => {
    unassignFromSpot.mutate(
      { spotId, eventId },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const isPending = assignToSpot.isPending || sendOfferMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Comedian</DialogTitle>
          <DialogDescription>
            Select a comedian to assign, or search to invite anyone on the platform.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search all comedians..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Comedian Lists */}
        <div className="max-h-[350px] overflow-y-auto space-y-3">
          {/* Shortlisted/Confirmed Section */}
          {filteredApplications.length > 0 && (
            <>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Confirmed & Shortlisted
              </div>
              <div className="space-y-2">
                {filteredApplications.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => handleAssign(app.comedian_id)}
                    disabled={isPending}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      app.comedian_id === currentComedianId
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <OptimizedAvatar
                      src={app.comedian_avatar}
                      name={app.comedian_name}
                      className="h-10 w-10"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{app.comedian_name}</p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          app.status === 'accepted'
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        )}
                      >
                        {app.status === 'accepted' ? 'Confirmed' : 'Shortlisted'}
                      </Badge>
                    </div>
                    {app.comedian_id === currentComedianId ? (
                      <Badge className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Current
                      </Badge>
                    ) : (
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Platform Search Results */}
          {filteredSearchResults.length > 0 && (
            <>
              {filteredApplications.length > 0 && <Separator className="my-3" />}
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Other Comedians (Send Offer)
              </div>
              <div className="space-y-2">
                {filteredSearchResults.map((comedian) => (
                  <button
                    key={comedian.comedian_id}
                    onClick={() => handleSendOffer(comedian.comedian_id)}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    <OptimizedAvatar
                      src={comedian.comedian_avatar}
                      name={comedian.comedian_name}
                      className="h-10 w-10"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{comedian.comedian_name}</p>
                      <Badge variant="secondary" className="text-xs">
                        Platform
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Send className="h-4 w-4" />
                      <span className="text-xs font-medium">Invite</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Loading State */}
          {isLoading && (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          )}

          {/* Empty State */}
          {!isLoading && filteredApplications.length === 0 && filteredSearchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserPlus className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search.length >= 2
                  ? 'No comedians found matching your search'
                  : 'No confirmed or shortlisted comedians. Search to invite someone.'}
              </p>
            </div>
          )}
        </div>

        {/* Unassign Option */}
        {currentComedianId && (
          <Button
            variant="secondary"
            onClick={handleUnassign}
            disabled={isPending || unassignFromSpot.isPending}
            className="w-full gap-2 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
            Remove Assignment
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AssignComedianDialog;
