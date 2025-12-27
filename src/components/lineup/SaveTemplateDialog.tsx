/**
 * SaveTemplateDialog Component
 *
 * Dialog for saving the current lineup as a reusable template.
 * Allows naming, description, and preview of spots being saved.
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Clock, DollarSign } from 'lucide-react';
import { useSaveLineupTemplate } from '@/hooks/useLineupTemplates';
import { formatCurrency } from '@/lib/utils';
import type { SpotData } from '@/types/spot';
import { EXTRA_TYPE_LABELS } from '@/types/spot';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spots: SpotData[];
  organizationId: string | null;
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  spots,
  organizationId,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [includePayments, setIncludePayments] = useState(true);

  const saveTemplate = useSaveLineupTemplate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;
    if (spots.length === 0) return;

    saveTemplate.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        spots,
        includePayments,
        organizationId: organizationId || undefined,
      },
      {
        onSuccess: () => {
          // Reset form and close
          setName('');
          setDescription('');
          setIncludePayments(true);
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setIncludePayments(true);
    }
    onOpenChange(isOpen);
  };

  // Calculate totals for preview
  const totalDuration = spots.reduce(
    (sum, spot) => sum + (spot.duration_minutes || 0),
    0
  );
  const totalPayment = spots.reduce(
    (sum, spot) => sum + (spot.payment_amount || 0),
    0
  );
  // Helper to get category from either SpotData or raw DB record
  const getCategory = (spot: SpotData) => {
    // Support both SpotData (category) and raw DB records (spot_category)
    return (spot as unknown as { spot_category?: string }).spot_category || spot.category;
  };

  // Helper to get spot name/label from either SpotData or raw DB record
  const getSpotName = (spot: SpotData) => {
    // Support both SpotData (label) and raw DB records (spot_name)
    return (spot as unknown as { spot_name?: string }).spot_name || spot.label;
  };

  const actCount = spots.filter(
    (s) => getCategory(s) === 'act' && s.spot_type !== 'extra'
  ).length;
  const breakCount = spots.filter((s) => {
    const cat = getCategory(s);
    return cat && cat !== 'act' && s.spot_type !== 'extra';
  }).length;
  const extraCount = spots.filter((s) => s.spot_type === 'extra').length;

  const getSpotLabel = (spot: SpotData) => {
    const category = getCategory(spot);
    const spotName = getSpotName(spot);

    if (spot.spot_type === 'extra' && spot.extra_type) {
      return EXTRA_TYPE_LABELS[spot.extra_type] || 'Extra';
    }
    if (category && category !== 'act') {
      return spotName || category;
    }
    // For act spots, use spot_name directly (MC, Feature, Headliner, etc.)
    return spotName || spot.type || 'Spot';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save as Template
            </DialogTitle>
            <DialogDescription>
              Save this lineup structure as a reusable template. Templates store
              spot types, durations, and optionally payment amounts - not
              comedian assignments.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Template Name */}
            <div className="grid gap-2">
              <Label htmlFor="templateName">Template Name *</Label>
              <Input
                id="templateName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Off The Record Standard"
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="templateDescription">
                Description (optional)
              </Label>
              <Textarea
                id="templateDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Doors 7pm, Show 7:30pm, MC + 5 acts"
                rows={2}
              />
            </div>

            {/* Include Payments Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePayments"
                checked={includePayments}
                onCheckedChange={(checked) =>
                  setIncludePayments(checked === true)
                }
              />
              <Label
                htmlFor="includePayments"
                className="text-sm font-normal cursor-pointer"
              >
                Include payment amounts in template
              </Label>
            </div>

            {/* Preview */}
            <div className="grid gap-2">
              <Label>Preview ({spots.length} spots)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {actCount > 0 && (
                  <Badge variant="secondary">{actCount} Acts</Badge>
                )}
                {breakCount > 0 && (
                  <Badge variant="secondary">{breakCount} Breaks</Badge>
                )}
                {extraCount > 0 && (
                  <Badge variant="secondary">{extraCount} Extras</Badge>
                )}
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {totalDuration} min
                </Badge>
                {includePayments && totalPayment > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(totalPayment)}
                  </Badge>
                )}
              </div>
              <ScrollArea className="h-[150px] rounded-md border p-2">
                <div className="space-y-1">
                  {spots.map((spot, index) => (
                    <div
                      key={spot.id}
                      className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-6">
                          {index + 1}.
                        </span>
                        <span>{getSpotLabel(spot)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{spot.duration_minutes || 0}m</span>
                        {includePayments && spot.payment_amount && (
                          <span>{formatCurrency(spot.payment_amount)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
              type="submit"
              disabled={
                saveTemplate.isPending || !name.trim() || spots.length === 0
              }
            >
              {saveTemplate.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SaveTemplateDialog;
