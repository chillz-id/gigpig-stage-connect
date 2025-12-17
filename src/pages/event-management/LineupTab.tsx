import { useState } from 'react';
import { Plus, ChevronDown, DoorOpen, Coffee, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExportMenu } from '@/components/event-management/ExportMenu';
import SpotListContainer from '@/components/lineup/SpotListContainer';
import LineupTimeline from '@/components/lineup/LineupTimeline';
import { AddSpotDialog } from '@/components/lineup/AddSpotDialog';
import { AddBreakDialog } from '@/components/lineup/AddBreakDialog';
import { useLineupStats, formatDuration } from '@/hooks/useLineupStats';
import { formatCurrency } from '@/lib/utils';
import type { SpotCategory } from '@/types/spot';

interface LineupTabProps {
  eventId: string;
  userId: string;
}

type ViewMode = 'list' | 'timeline';

export default function LineupTab({ eventId, userId }: LineupTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showAddSpotDialog, setShowAddSpotDialog] = useState(false);
  const [showAddBreakDialog, setShowAddBreakDialog] = useState(false);
  const [breakType, setBreakType] = useState<SpotCategory>('intermission');

  const handleAddBreak = (type: SpotCategory) => {
    setBreakType(type);
    setShowAddBreakDialog(true);
  };

  // Fetch event title for export
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

  // Fetch lineup statistics
  const { data: stats, isLoading: statsLoading } = useLineupStats(eventId);

  const isOwner = event?.organizer_id === userId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Lineup</h2>
          <p className="text-sm text-muted-foreground">
            Manage spots, assign comedians, and configure payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            eventId={eventId}
            eventTitle={event?.title || 'Event'}
            userId={userId}
            isOwner={isOwner}
            exportType="lineup"
          />
          <Button
            className="professional-button"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}
          >
            {viewMode === 'list' ? 'Timeline View' : 'List View'}
          </Button>

          {/* Add Break Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Break
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAddBreak('doors')}>
                <DoorOpen className="mr-2 h-4 w-4" />
                Doors Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddBreak('intermission')}>
                <Coffee className="mr-2 h-4 w-4" />
                Intermission
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddBreak('custom')}>
                <Sparkles className="mr-2 h-4 w-4" />
                Custom Break...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Spot Button */}
          <Button onClick={() => setShowAddSpotDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Spot
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          <strong>Lineup Management:</strong> Create spots for your event, assign comedians
          from applications or directly, and configure payment details. Spots can be
          reordered by dragging in list view.
        </AlertDescription>
      </Alert>

      {/* Quick Stats - Moved to top */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Lineup Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Spots</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 bg-muted" />
              ) : (
                <p className="text-2xl font-bold">{stats?.totalSpots || 0}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Filled Spots</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16 bg-muted" />
              ) : (
                <p className="text-2xl font-bold">{stats?.filledSpots || 0}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Duration</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-24 bg-muted" />
              ) : (
                <p className="text-2xl font-bold">{formatDuration(stats?.totalDuration || 0)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lineup Display */}
      {viewMode === 'list' ? (
        <SpotListContainer eventId={eventId} />
      ) : (
        <LineupTimeline eventId={eventId} userId={userId} />
      )}

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>
            Overview of all comedian payments for this event (including GST breakdown)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Gross</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-xl font-bold">{formatCurrency(stats?.totalGross || 0)}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Tax (GST)</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-xl font-bold text-muted-foreground">{formatCurrency(stats?.totalTax || 0)}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Net</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-xl font-bold">{formatCurrency(stats?.totalNet || 0)}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Paid</p>
              {statsLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats?.totalPaid || 0)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Pro Tips:</strong></p>
            <ul className="list-inside list-disc space-y-1 pl-4">
              <li>
                <strong>Drag & Drop:</strong> Reorder spots by dragging in list view
              </li>
              <li>
                <strong>Quick Assignment:</strong> Click "Assign" to select from confirmed
                applications
              </li>
              <li>
                <strong>Payment Config:</strong> Set payment amounts and tax for each spot
              </li>
              <li>
                <strong>Timeline View:</strong> See the show flow with time gaps and
                overlaps
              </li>
              <li>
                <strong>Batch Operations:</strong> Select multiple spots for bulk updates
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Add Spot Dialog */}
      <AddSpotDialog
        open={showAddSpotDialog}
        onOpenChange={setShowAddSpotDialog}
        eventId={eventId}
        onSpotCreated={() => {
          setShowAddSpotDialog(false);
        }}
      />

      {/* Add Break Dialog */}
      <AddBreakDialog
        open={showAddBreakDialog}
        onOpenChange={setShowAddBreakDialog}
        eventId={eventId}
        breakType={breakType}
        onBreakCreated={() => {
          setShowAddBreakDialog(false);
        }}
      />
    </div>
  );
}
