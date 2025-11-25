import { useState } from 'react';
import { PlatformLayout } from '@/components/layout/PlatformLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BugCard } from '@/components/bugs/BugCard';
import { BugDetailDialog } from '@/components/bugs/BugDetailDialog';
import { ReportBugDialog } from '@/components/bugs/ReportBugDialog';
import { useBugs, useUpdateBug } from '@/hooks/useBugTracker';
import { useAuth } from '@/contexts/AuthContext';
import { BugReport } from '@/services/bugs/bug-service';
import { AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BUG_COLUMNS = [
  {
    id: 'requested',
    title: 'Reported',
    description: 'Newly submitted',
    color: 'border-l-4 border-l-slate-400 bg-card',
  },
  {
    id: 'planned',
    title: 'Confirmed',
    description: 'Verified & queued',
    color: 'border-l-4 border-l-blue-500 bg-card',
  },
  {
    id: 'in_progress',
    title: 'Fixing',
    description: 'Work in progress',
    color: 'border-l-4 border-l-amber-500 bg-card',
  },
  {
    id: 'completed',
    title: 'Fixed',
    description: 'Resolved & deployed',
    color: 'border-l-4 border-l-green-500 bg-card',
  },
];

export default function BugTracker() {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [draggedBug, setDraggedBug] = useState<BugReport | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const { data: bugs, isLoading } = useBugs();
  const updateBugMutation = useUpdateBug();

  // Group bugs by status
  const bugsByStatus: Record<string, BugReport[]> = {};
  BUG_COLUMNS.forEach((col) => {
    bugsByStatus[col.id] = [];
  });

  if (bugs) {
    bugs.forEach((bug) => {
      const status = bug.status;
      if (bugsByStatus[status]) {
        bugsByStatus[status].push(bug);
      }
    });
  }

  // Calculate severity counts for header stats
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  if (bugs) {
    bugs.forEach((bug) => {
      if (bug.status !== 'completed') {
        severityCounts[bug.severity]++;
      }
    });
  }

  const handleBugClick = (bug: BugReport) => {
    setSelectedBugId(bug.id);
    setDetailDialogOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, bug: BugReport) => {
    if (!isAdmin) return;
    setDraggedBug(bug);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedBug(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    if (!isAdmin || !draggedBug) return;
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!isAdmin || !draggedBug || draggedBug.status === columnId) {
      setDraggedBug(null);
      setDragOverColumn(null);
      return;
    }

    try {
      await updateBugMutation.mutateAsync({
        id: draggedBug.id,
        data: { status: columnId },
      });
      toast.success('Bug status updated');
    } catch (error) {
      console.error('Error updating bug status:', error);
      toast.error('Failed to update bug status');
    }

    setDraggedBug(null);
    setDragOverColumn(null);
  };

  return (
    <PlatformLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              Bug Tracker
            </h1>
            <p className="text-muted-foreground mt-1">
              Report bugs, track fixes, and improve platform quality
            </p>
          </div>

          <Button
            onClick={() => setReportDialogOpen(true)}
            className="shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Report Bug
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔴</span>
                <div>
                  <p className="text-2xl font-bold">{severityCounts.critical}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🟠</span>
                <div>
                  <p className="text-2xl font-bold">{severityCounts.high}</p>
                  <p className="text-xs text-muted-foreground">High</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🟡</span>
                <div>
                  <p className="text-2xl font-bold">{severityCounts.medium}</p>
                  <p className="text-xs text-muted-foreground">Medium</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚪</span>
                <div>
                  <p className="text-2xl font-bold">{severityCounts.low}</p>
                  <p className="text-xs text-muted-foreground">Low</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin notice */}
        {isAdmin && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              You can drag and drop bug cards between columns to change their status
            </p>
          </div>
        )}

        {/* Kanban board */}
        {isLoading ? (
          <div className="text-center py-12">Loading bugs...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BUG_COLUMNS.map((column) => {
              const columnBugs = bugsByStatus[column.id] || [];
              const isDragOver = dragOverColumn === column.id;

              return (
                <Card
                  key={column.id}
                  className={cn(
                    'flex flex-col',
                    column.color,
                    isDragOver && 'ring-2 ring-primary'
                  )}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <span>{column.title}</span>
                      <Badge variant="secondary" className="ml-2">
                        {columnBugs.length}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {column.description}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3 pt-3">
                    {columnBugs.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No bugs
                      </div>
                    ) : (
                      columnBugs.map((bug) => (
                        <BugCard
                          key={bug.id}
                          bug={bug}
                          onClick={handleBugClick}
                          isDraggable={isAdmin}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ReportBugDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
      />

      <BugDetailDialog
        bugId={selectedBugId}
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setSelectedBugId(null);
          }
        }}
      />
    </PlatformLayout>
  );
}
