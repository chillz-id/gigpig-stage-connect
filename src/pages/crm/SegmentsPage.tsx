import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  MoreVertical,
  Download,
  Upload,
  Pencil,
  Trash2,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EditSegmentDialog } from '@/components/crm/segments/EditSegmentDialog';
import { CreateSegmentDialog } from '@/components/crm/customer-filters/CreateSegmentDialog';
import {
  useSegmentsWithDetails,
  useCustomerSegmentCounts,
  useUpdateSegment,
  useDeleteSegment,
  useExportCustomers,
} from '@/hooks/useCustomers';
import { useSegmentManager } from '@/hooks/crm/useSegmentManager';
import type { SegmentWithId } from '@/services/crm/segment-service';

export function SegmentsPage() {
  const navigate = useNavigate();
  const { data: segments, isLoading, refetch, isFetching } = useSegmentsWithDetails();
  const { data: segmentCounts } = useCustomerSegmentCounts();
  const updateSegment = useUpdateSegment();
  const deleteSegment = useDeleteSegment();
  const exportMutation = useExportCustomers();

  // Create segment dialog state
  const segmentManager = useSegmentManager({
    onSegmentCreated: () => {
      refetch();
    },
  });

  // Edit segment dialog state
  const [editingSegment, setEditingSegment] = useState<SegmentWithId | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<SegmentWithId | null>(null);

  // Get customer count for a segment
  const getCustomerCount = (slug: string): number => {
    const found = segmentCounts?.find((s) => s.slug === slug);
    return found?.count ?? 0;
  };

  const handleEdit = (segment: SegmentWithId) => {
    setEditingSegment(segment);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (updates: {
    name?: string;
    color?: string | null;
    description?: string | null;
  }) => {
    if (!editingSegment) return;

    try {
      await updateSegment.mutateAsync({
        id: editingSegment.id,
        ...updates,
      });
      toast.success('Segment updated');
      setEditDialogOpen(false);
      setEditingSegment(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update segment';
      toast.error(message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await deleteSegment.mutateAsync(deleteTarget.id);
      toast.success(`Segment "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete segment';
      toast.error(message);
    }
  };

  const handleExport = async (segment: SegmentWithId) => {
    try {
      const count = await exportMutation.mutateAsync({ segments: [segment.slug] });
      toast.success(`Exported ${count} customers from "${segment.name}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export segment';
      toast.error(message);
    }
  };

  const handleImport = (segment: SegmentWithId) => {
    navigate(`/crm/import-export?segment=${segment.slug}`);
  };

  const handleViewCustomers = (segment: SegmentWithId) => {
    navigate(`/crm/customers?segment=${segment.slug}`);
  };

  const handleSendEDM = (segment: SegmentWithId) => {
    toast.info(`EDM feature coming soon for "${segment.name}"`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Segments</h1>
          <p className="text-muted-foreground">
            Manage customer segments for targeted marketing and analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={segmentManager.openDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Segment
          </Button>
        </div>
      </div>

      {/* Segments List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : segments && segments.length > 0 ? (
        <div className="border rounded-lg divide-y">
          {segments.map((segment) => {
            const customerCount = getCustomerCount(segment.slug);
            return (
              <div
                key={segment.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleViewCustomers(segment)}
              >
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: segment.color || '#9ca3af' }}
                />

                {/* Name and description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium hover:underline">{segment.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {customerCount.toLocaleString()} customer{customerCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {segment.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {segment.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSendEDM(segment)}
                    disabled={customerCount === 0}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send EDM
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleImport(segment)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import to Segment
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(segment)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEdit(segment)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Segment
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(segment)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Segment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">
            No segments yet. Create your first segment to organize customers.
          </p>
          <Button onClick={segmentManager.openDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Segment
          </Button>
        </div>
      )}

      {/* Create Segment Dialog */}
      <CreateSegmentDialog
        open={segmentManager.dialogOpen}
        onOpenChange={segmentManager.setDialogOpen}
        name={segmentManager.form.name}
        color={segmentManager.form.color}
        onNameChange={(value) => segmentManager.updateForm({ name: value })}
        onColorChange={(value) => segmentManager.updateForm({ color: value })}
        onClearColor={segmentManager.clearColour}
        previewColor={segmentManager.previewColor}
        defaultColourSwatch={segmentManager.defaultColourSwatch}
        onSubmit={segmentManager.submit}
        isSubmitting={segmentManager.isSubmitting}
      />

      {/* Edit Segment Dialog */}
      <EditSegmentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        segment={editingSegment}
        onSubmit={handleEditSubmit}
        isSubmitting={updateSegment.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Segment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This will remove{' '}
              {deleteTarget ? getCustomerCount(deleteTarget.slug) : 0} customer
              {deleteTarget && getCustomerCount(deleteTarget.slug) !== 1 ? 's' : ''} from this
              segment. The customers themselves will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteSegment.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSegment.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
