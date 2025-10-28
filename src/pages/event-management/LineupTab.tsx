import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SpotListContainer from '@/components/lineup/SpotListContainer';
import SpotFilters from '@/components/lineup/SpotFilters';
import LineupTimeline from '@/components/lineup/LineupTimeline';
import type { SpotType, SpotStatus } from '@/types/spot';

interface LineupTabProps {
  eventId: string;
  userId: string;
}

type ViewMode = 'list' | 'timeline';

interface FilterState {
  spotType: SpotType | 'all';
  status: SpotStatus | 'all';
  assignment: 'filled' | 'open' | 'all';
  sort: 'position' | 'time' | 'payment';
}

export default function LineupTab({ eventId, userId }: LineupTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<FilterState>({
    spotType: 'all',
    status: 'all',
    assignment: 'all',
    sort: 'position',
  });
  const [showAddSpotDialog, setShowAddSpotDialog] = useState(false);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}
          >
            {viewMode === 'list' ? 'Timeline View' : 'List View'}
          </Button>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Display</CardTitle>
          <CardDescription>
            Filter and sort the lineup to focus on specific spot types or statuses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpotFilters
            spotType={filters.spotType}
            status={filters.status}
            assignment={filters.assignment}
            sort={filters.sort}
            onFilterChange={handleFilterChange}
          />
        </CardContent>
      </Card>

      {/* Lineup Display */}
      {viewMode === 'list' ? (
        <SpotListContainer
          eventId={eventId}
          userId={userId}
          spotTypeFilter={filters.spotType}
          statusFilter={filters.status}
          assignmentFilter={filters.assignment}
          sortBy={filters.sort}
        />
      ) : (
        <LineupTimeline
          eventId={eventId}
          userId={userId}
          spotTypeFilter={filters.spotType}
          statusFilter={filters.status}
        />
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Lineup Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Spots</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Filled Spots</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Duration</p>
              <p className="text-2xl font-bold">- min</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>
            Overview of all comedian payments for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Gross</p>
              <p className="text-xl font-bold">$-</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Tax</p>
              <p className="text-xl font-bold">$-</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Net</p>
              <p className="text-xl font-bold">$-</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Paid</p>
              <p className="text-xl font-bold text-green-600">$-</p>
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
    </div>
  );
}
