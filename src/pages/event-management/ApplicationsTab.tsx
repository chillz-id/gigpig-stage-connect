/**
 * ApplicationsTab Component
 *
 * Full page assembly for Applications Tab with all features:
 * - Header, Filters, List, Shortlist Panel, Bulk Actions
 * - Multi-select, hide/show toggle, filtering, sorting
 */

import React, { useState } from 'react';
import { Users, CheckCircle, XCircle, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExportMenu } from '@/components/event-management/ExportMenu';
import { ApplicationFilters, type FilterState } from '@/components/applications/ApplicationFilters';
import { ApplicationListContainer } from '@/components/applications/ApplicationListContainer';
import { ShortlistPanelContainer } from '@/components/applications/ShortlistPanelContainer';
import { ApplicationBulkActions } from '@/components/applications/ApplicationBulkActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  useBulkApproveApplications,
  useBulkRejectApplications,
  useBulkAddToShortlist
} from '@/hooks/useApplicationApproval';
import { useApplicationStats } from '@/hooks/useApplicationStats';
import { useToast } from '@/hooks/use-toast';

interface ApplicationsTabProps {
  eventId: string;
  userId: string;
  totalSpots?: number;
  hiddenComedianIds?: string[];
  onHideComedians?: (comedianIds: string[], scope: 'event' | 'global') => void;
  /** When true, hides header and adjusts styling for modal context */
  inModal?: boolean;
}

export default function ApplicationsTab({
  eventId,
  userId,
  totalSpots,
  hiddenComedianIds = [],
  onHideComedians,
  inModal = false
}: ApplicationsTabProps) {
  const { toast } = useToast();

  // Fetch event info
  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('title, organizer_id')
        .eq('id', eventId)
        .single();
      return data;
    },
  });

  // Fetch application statistics
  const { data: stats, isLoading: statsLoading } = useApplicationStats(eventId);

  const isOwner = event?.organizer_id === userId;

  // State
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    spotType: 'all',
    sort: 'newest'
  });
  const [showHidden, setShowHidden] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Mutations
  const { mutate: bulkApprove, isPending: isApproving } = useBulkApproveApplications();
  const { mutate: bulkReject, isPending: isRejecting } = useBulkRejectApplications();
  const { mutate: bulkShortlist, isPending: isShortlisting } = useBulkAddToShortlist();

  const isAnyLoading = isApproving || isRejecting || isShortlisting;

  // Handlers
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleToggleShowHidden = () => {
    setShowHidden(!showHidden);
  };

  const handleSelectionChange = (newSelectedIds: string[]) => {
    setSelectedIds(newSelectedIds);
  };

  const handleConfirmAll = () => {
    if (selectedIds.length === 0) return;

    bulkApprove(
      { applicationIds: selectedIds, eventId },
      {
        onSuccess: () => {
          setSelectedIds([]);
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to confirm applications'
          });
        }
      }
    );
  };

  const handleRejectAll = () => {
    if (selectedIds.length === 0) return;

    bulkReject(
      { applicationIds: selectedIds, eventId },
      {
        onSuccess: () => {
          setSelectedIds([]);
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to reject applications'
          });
        }
      }
    );
  };

  const handleShortlistAll = () => {
    if (selectedIds.length === 0) return;

    bulkShortlist(
      { applicationIds: selectedIds, userId, eventId },
      {
        onSuccess: () => {
          setSelectedIds([]);
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Failed to add to shortlist'
          });
        }
      }
    );
  };

  const handleHideAll = (scope: 'event' | 'global') => {
    if (selectedIds.length === 0 || !onHideComedians) return;

    // Extract comedian IDs from selected applications
    // Note: This requires fetching application data to get comedian_ids
    // For now, we'll pass the application IDs and let parent handle it
    onHideComedians(selectedIds, scope);
    setSelectedIds([]);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Get status filter for API
  const statusFilter = filters.status === 'all' ? undefined : filters.status;

  return (
    <div className={inModal ? "flex flex-col" : "flex h-full flex-col"}>
      {/* Header removed - stats are shown in the stats grid below */}

      {/* Main Content Area */}
      <div className={inModal ? "flex flex-col gap-4" : "flex flex-1 overflow-hidden"}>
        {/* Left: Applications List */}
        <div className={`flex flex-1 flex-col gap-4 overflow-auto ${inModal ? 'p-0' : 'p-6'}`}>
          {/* Filters and Export */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <ApplicationFilters
                filters={filters}
                showHidden={showHidden}
                onFilterChange={handleFilterChange}
                onToggleShowHidden={handleToggleShowHidden}
              />
            </div>
            <ExportMenu
              eventId={eventId}
              eventTitle={event?.title || 'Event'}
              userId={userId}
              isOwner={isOwner}
              exportType="applications"
            />
          </div>

          {/* Application Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
                )}
                {statsLoading ? (
                  <Skeleton className="mt-1 h-4 w-24" />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {stats?.pendingApplications || 0} pending
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.confirmedApplications || 0}
                  </div>
                )}
                {statsLoading ? (
                  <Skeleton className="mt-1 h-4 w-24" />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {stats?.rejectedApplications || 0} rejected
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold text-amber-500">
                    {stats?.shortlistedApplications || 0}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Favorites</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">By Type</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">MC:</span>
                      <span className="font-medium">{stats?.mcApplications || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Feature:</span>
                      <span className="font-medium">{stats?.featureApplications || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Headliner:</span>
                      <span className="font-medium">{stats?.headlinerApplications || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Applications List with Multi-Select */}
          <ApplicationListContainer
            eventId={eventId}
            userId={userId}
            statusFilter={statusFilter}
            showHidden={showHidden}
            hiddenComedianIds={hiddenComedianIds}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        {/* Right: Shortlist Panel (sidebar on desktop, sheet on mobile) - hidden in modal */}
        {!inModal && (
          <ShortlistPanelContainer
            eventId={eventId}
            userId={userId}
            totalSpots={totalSpots}
          />
        )}
      </div>

      {/* Bulk Actions Bar (sticky bottom, only visible when items selected) */}
      <ApplicationBulkActions
        selectedIds={selectedIds}
        onConfirmAll={handleConfirmAll}
        onRejectAll={handleRejectAll}
        onShortlistAll={handleShortlistAll}
        onHideAll={handleHideAll}
        onClearSelection={handleClearSelection}
        isLoading={isAnyLoading}
      />
    </div>
  );
}
