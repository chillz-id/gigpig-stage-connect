/**
 * LoadTemplateDialog Component
 *
 * Dialog for loading a saved lineup template into an event.
 * Shows template list, preview, and confirmation for replacing existing spots.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderOpen,
  Clock,
  DollarSign,
  FileText,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  useLineupTemplates,
  useLoadLineupTemplate,
  useDeleteLineupTemplate,
} from '@/hooks/useLineupTemplates';
import { formatCurrency } from '@/lib/utils';
import type { LineupTemplate, LineupTemplateSpot } from '@/types/spot';
import { EXTRA_TYPE_LABELS } from '@/types/spot';

interface LoadTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  hasExistingSpots: boolean;
  organizationId: string | null;
}

export function LoadTemplateDialog({
  open,
  onOpenChange,
  eventId,
  hasExistingSpots,
  organizationId,
}: LoadTemplateDialogProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<LineupTemplate | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<LineupTemplate | null>(null);

  const { data: templates, isLoading } = useLineupTemplates(organizationId);
  const loadTemplate = useLoadLineupTemplate();
  const deleteTemplate = useDeleteLineupTemplate();

  const handleLoadTemplate = () => {
    if (!selectedTemplate) return;

    // If there are existing spots, show confirmation dialog
    if (hasExistingSpots) {
      setShowConfirmDialog(true);
    } else {
      // No existing spots, load directly
      doLoadTemplate();
    }
  };

  const doLoadTemplate = () => {
    if (!selectedTemplate) return;

    loadTemplate.mutate(
      {
        eventId,
        templateId: selectedTemplate.id,
        replaceExisting: true,
      },
      {
        onSuccess: () => {
          setSelectedTemplate(null);
          setShowConfirmDialog(false);
          onOpenChange(false);
        },
      }
    );
  };

  const handleDeleteTemplate = (template: LineupTemplate) => {
    setTemplateToDelete(template);
  };

  const confirmDeleteTemplate = () => {
    if (!templateToDelete || !organizationId) return;

    deleteTemplate.mutate(
      { templateId: templateToDelete.id, organizationId },
      {
        onSuccess: () => {
          setTemplateToDelete(null);
          if (selectedTemplate?.id === templateToDelete.id) {
            setSelectedTemplate(null);
          }
        },
      }
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedTemplate(null);
      setShowConfirmDialog(false);
    }
    onOpenChange(isOpen);
  };

  const getSpotLabel = (spot: LineupTemplateSpot) => {
    if (spot.spot_type === 'extra' && spot.extra_type) {
      return EXTRA_TYPE_LABELS[spot.extra_type] || 'Extra';
    }
    if (spot.category !== 'act') {
      return spot.label || spot.category;
    }
    return spot.type || 'Spot';
  };

  const calculateTemplateTotals = (spots: LineupTemplateSpot[]) => {
    // Only count duration from acts (not extras which use hours)
    const totalDuration = spots
      .filter(s => s.spot_type !== 'extra')
      .reduce((sum, spot) => sum + (spot.duration_minutes || 0), 0);
    const totalPayment = spots.reduce(
      (sum, spot) => sum + (spot.payment_amount || 0),
      0
    );
    // Count only performer acts (not breaks or extras)
    const actCount = spots.filter(
      s => s.category === 'act' && s.spot_type !== 'extra'
    ).length;
    const breakCount = spots.filter(
      s => s.category !== 'act'
    ).length;
    const extraCount = spots.filter(
      s => s.spot_type === 'extra'
    ).length;
    return { totalDuration, totalPayment, actCount, breakCount, extraCount };
  };

  const formatSpotDuration = (spot: LineupTemplateSpot) => {
    // For extras, show hours instead of minutes
    if (spot.spot_type === 'extra' && spot.hours) {
      const h = Math.floor(spot.hours);
      const m = Math.round((spot.hours - h) * 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${spot.duration_minutes || 0}m`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Load Template
            </DialogTitle>
            <DialogDescription>
              Select a saved lineup template to apply to this event. This will
              create spots from the template structure.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4 min-h-[300px]">
            {/* Template List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Templates
              </p>
              <ScrollArea className="h-[280px] rounded-md border">
                {isLoading ? (
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : templates && templates.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {templates.map((template) => {
                      const totals = calculateTemplateTotals(template.spots);
                      return (
                      <div
                        key={template.id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {template.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {totals.actCount} acts
                            {totals.breakCount > 0 && ` · ${totals.breakCount} breaks`}
                            {totals.extraCount > 0 && ` · ${totals.extraCount} extras`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );})}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No templates saved yet</p>
                    <p className="text-xs mt-1">
                      Create a lineup and save it as a template
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Template Preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Preview
              </p>
              <ScrollArea className="h-[280px] rounded-md border">
                {selectedTemplate ? (
                  <div className="p-3 space-y-3">
                    <div>
                      <h4 className="font-medium">{selectedTemplate.name}</h4>
                      {selectedTemplate.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedTemplate.description}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    {(() => {
                      const totals = calculateTemplateTotals(selectedTemplate.spots);
                      return (
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {totals.actCount} acts
                          </Badge>
                          {totals.breakCount > 0 && (
                            <Badge variant="secondary">
                              {totals.breakCount} breaks
                            </Badge>
                          )}
                          {totals.extraCount > 0 && (
                            <Badge variant="secondary">
                              {totals.extraCount} extras
                            </Badge>
                          )}
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {totals.totalDuration} min
                          </Badge>
                          {totals.totalPayment > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(totals.totalPayment)}
                            </Badge>
                          )}
                        </div>
                      );
                    })()}

                    {/* Spot List */}
                    <div className="space-y-1">
                      {selectedTemplate.spots.map((spot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-5">
                              {index + 1}.
                            </span>
                            <span>{getSpotLabel(spot)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <span>{formatSpotDuration(spot)}</span>
                            {spot.payment_amount && (
                              <span>
                                {formatCurrency(spot.payment_amount)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">Select a template to preview</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLoadTemplate}
              disabled={!selectedTemplate || loadTemplate.isPending}
            >
              {loadTemplate.isPending ? 'Loading...' : 'Load Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Replace Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Replace Existing Lineup?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This event already has spots in the lineup. Loading a template
              will replace all existing spots. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doLoadTemplate}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Replace & Load
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Template Dialog */}
      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={() => setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTemplate}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default LoadTemplateDialog;
