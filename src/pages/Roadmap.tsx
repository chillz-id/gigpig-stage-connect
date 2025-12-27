import { useState } from 'react';
import { PlatformLayout } from '@/components/layout/PlatformLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeatureCard } from '@/components/roadmap/FeatureCard';
import { FeatureDetailDialog } from '@/components/roadmap/FeatureDetailDialog';
import { RequestFeatureDialog } from '@/components/roadmap/RequestFeatureDialog';
import { useFeatures } from '@/hooks/useRoadmap';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateFeature } from '@/hooks/useRoadmap';
import { FeatureRequest } from '@/services/roadmap/roadmap-service';
import { Lightbulb, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ROADMAP_COLUMNS = [
  {
    id: 'requested',
    title: 'Requested',
    description: 'Community feature requests',
    color: 'border-l-4 border-l-slate-400 bg-card',
  },
  {
    id: 'planned',
    title: 'Planned',
    description: 'Approved for development',
    color: 'border-l-4 border-l-blue-500 bg-card',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    description: 'Currently being built',
    color: 'border-l-4 border-l-amber-500 bg-card',
  },
  {
    id: 'completed',
    title: 'Completed',
    description: 'Shipped features',
    color: 'border-l-4 border-l-green-500 bg-card',
  },
];

export default function Roadmap() {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [draggedFeature, setDraggedFeature] = useState<FeatureRequest | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const { data: features, isLoading } = useFeatures();
  const updateFeatureMutation = useUpdateFeature();

  // Group features by status
  const featuresByStatus: Record<string, FeatureRequest[]> = {};
  ROADMAP_COLUMNS.forEach((col) => {
    featuresByStatus[col.id] = [];
  });

  if (features) {
    features.forEach((feature) => {
      const status = feature.status;
      if (featuresByStatus[status]) {
        featuresByStatus[status].push(feature);
      }
    });
  }

  const handleFeatureClick = (feature: FeatureRequest) => {
    setSelectedFeatureId(feature.id);
    setDetailDialogOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, feature: FeatureRequest) => {
    if (!isAdmin) return;
    setDraggedFeature(feature);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedFeature(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    if (!isAdmin || !draggedFeature) return;
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!isAdmin || !draggedFeature || draggedFeature.status === columnId) {
      setDraggedFeature(null);
      setDragOverColumn(null);
      return;
    }

    try {
      await updateFeatureMutation.mutateAsync({
        id: draggedFeature.id,
        data: { status: columnId },
      });
      toast.success('Feature status updated');
    } catch (error) {
      console.error('Error updating feature status:', error);
      toast.error('Failed to update feature status');
    }

    setDraggedFeature(null);
    setDragOverColumn(null);
  };

  return (
    <PlatformLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Lightbulb className="h-8 w-8 text-yellow-500" />
              Feature Roadmap
            </h1>
            <p className="text-muted-foreground mt-1">
              Request features, vote on priorities, and track development progress
            </p>
          </div>

          <Button
            onClick={() => setRequestDialogOpen(true)}
            className="shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Feature
          </Button>
        </div>

        {/* Admin notice */}
        {isAdmin && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              You can drag and drop cards between columns to change their status
            </p>
          </div>
        )}

        {/* Kanban board */}
        {isLoading ? (
          <div className="text-center py-12">Loading features...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROADMAP_COLUMNS.map((column) => {
              const columnFeatures = featuresByStatus[column.id] || [];
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
                        {columnFeatures.length}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {column.description}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3 pt-3">
                    {columnFeatures.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No features
                      </div>
                    ) : (
                      columnFeatures.map((feature) => (
                        <FeatureCard
                          key={feature.id}
                          feature={feature}
                          onClick={handleFeatureClick}
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
      <RequestFeatureDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
      />

      <FeatureDetailDialog
        featureId={selectedFeatureId}
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setSelectedFeatureId(null);
          }
        }}
      />
    </PlatformLayout>
  );
}
