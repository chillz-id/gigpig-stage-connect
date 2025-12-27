/**
 * AddLineItemDialog Component
 *
 * Dialog for managing payment line items for a spot.
 * Shows existing items in a table with edit/delete options.
 * Supports quick presets (Fee, Travel, Merch) and custom entries.
 * GST options: Excluded, Included, Addition
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
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useSpotLineItems } from '@/hooks/useSpotLineItems';
import { LINE_ITEM_PRESETS, GST_RATE } from '@/types/spot';
import type { GstType, SpotLineItem } from '@/types/spot';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, X, Check } from 'lucide-react';

interface AddLineItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spotId: string;
  eventId: string;
  comedianName?: string;
}

/**
 * Calculate GST breakdown for display
 */
function calculateGstBreakdown(amount: number, gstType: GstType) {
  if (gstType === 'excluded') {
    return { base: amount, gst: 0, total: amount };
  } else if (gstType === 'included') {
    const base = amount / (1 + GST_RATE);
    const gst = amount - base;
    return { base, gst, total: amount };
  } else {
    const gst = amount * GST_RATE;
    return { base: amount, gst, total: amount + gst };
  }
}

/**
 * Format GST type for display
 */
function formatGstType(gstType: GstType): string {
  switch (gstType) {
    case 'excluded':
      return 'No GST';
    case 'included':
      return 'Incl. GST';
    case 'addition':
      return '+ GST';
    default:
      return '';
  }
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Line item row component with edit/delete
 */
interface LineItemRowProps {
  item: SpotLineItem;
  onUpdate: (id: string, data: { label: string; amount: number; gst_type: GstType }) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function LineItemRow({ item, onUpdate, onDelete, isUpdating, isDeleting }: LineItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(item.label);
  const [editAmount, setEditAmount] = useState(Math.abs(item.amount).toString());
  const [editIsNegative, setEditIsNegative] = useState(item.amount < 0);
  const [editGstType, setEditGstType] = useState<GstType>(item.gst_type);

  const handleSave = () => {
    const amount = parseFloat(editAmount) || 0;
    onUpdate(item.id, {
      label: editLabel.trim(),
      amount: editIsNegative ? -Math.abs(amount) : Math.abs(amount),
      gst_type: editGstType,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditLabel(item.label);
    setEditAmount(Math.abs(item.amount).toString());
    setEditIsNegative(item.amount < 0);
    setEditGstType(item.gst_type);
    setIsEditing(false);
  };

  const breakdown = calculateGstBreakdown(Math.abs(item.amount), item.gst_type);

  if (isEditing) {
    return (
      <div className="p-3 border rounded-md bg-muted/20 space-y-3">
        <div className="flex gap-2">
          <Input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="Label"
            className="flex-1"
          />
          <div className="flex rounded-md border divide-x">
            <Button
              type="button"
              variant={!editIsNegative ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-9 rounded-r-none border-0 px-2',
                !editIsNegative && 'bg-green-600 hover:bg-green-700'
              )}
              onClick={() => setEditIsNegative(false)}
            >
              +
            </Button>
            <Button
              type="button"
              variant={editIsNegative ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-9 rounded-l-none border-0 px-2',
                editIsNegative && 'bg-red-600 hover:bg-red-700'
              )}
              onClick={() => setEditIsNegative(true)}
            >
              -
            </Button>
          </div>
          <div className="relative w-24">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="pl-5"
            />
          </div>
        </div>
        <RadioGroup
          value={editGstType}
          onValueChange={(v) => setEditGstType(v as GstType)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-1.5">
            <RadioGroupItem value="excluded" id={`edit-gst-excluded-${item.id}`} />
            <Label htmlFor={`edit-gst-excluded-${item.id}`} className="cursor-pointer font-normal text-xs">
              Excluded
            </Label>
          </div>
          <div className="flex items-center space-x-1.5">
            <RadioGroupItem value="included" id={`edit-gst-included-${item.id}`} />
            <Label htmlFor={`edit-gst-included-${item.id}`} className="cursor-pointer font-normal text-xs">
              Included
            </Label>
          </div>
          <div className="flex items-center space-x-1.5">
            <RadioGroupItem value="addition" id={`edit-gst-addition-${item.id}`} />
            <Label htmlFor={`edit-gst-addition-${item.id}`} className="cursor-pointer font-normal text-xs">
              + GST
            </Label>
          </div>
        </RadioGroup>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={isUpdating}>
            <Check className="h-4 w-4 mr-1" /> {isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 px-3 border rounded-md hover:bg-muted/30 group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={cn(
          'font-medium tabular-nums',
          item.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
        )}>
          {item.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(item.amount))}
        </span>
        <span className="truncate">{item.label}</span>
        <Badge variant="secondary" className="text-xs shrink-0">
          {formatGstType(item.gst_type)}
        </Badge>
        {item.gst_type !== 'excluded' && (
          <span className="text-xs text-muted-foreground shrink-0">
            (GST: {formatCurrency(breakdown.gst)})
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(item.id)}
          disabled={isDeleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function AddLineItemDialog({
  open,
  onOpenChange,
  spotId,
  eventId,
  comedianName,
}: AddLineItemDialogProps) {
  // Form state for new item
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [gstType, setGstType] = useState<GstType>('excluded');
  const [isNegative, setIsNegative] = useState(false);

  const {
    lineItems,
    isLoading,
    addLineItemAsync,
    updateLineItemAsync,
    deleteLineItemAsync,
    isAdding,
    isUpdating,
    isDeleting,
  } = useSpotLineItems(spotId, eventId);

  // Handle preset selection
  const handlePreset = (preset: (typeof LINE_ITEM_PRESETS)[number]) => {
    setLabel(preset.label);
    setGstType(preset.gst_type);
    // Merch and Commission are typically negative (deductions)
    setIsNegative(preset.label === 'Merch' || preset.label === 'Commission');
  };

  // Reset form
  const resetForm = () => {
    setLabel('');
    setAmount('');
    setGstType('excluded');
    setIsNegative(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount === 0) {
      return;
    }

    if (!label.trim()) {
      return;
    }

    try {
      await addLineItemAsync({
        label: label.trim(),
        amount: isNegative ? -Math.abs(numericAmount) : Math.abs(numericAmount),
        gst_type: gstType,
      });
      resetForm();
    } catch (error) {
      // Error handled by the hook
    }
  };

  // Handle update
  const handleUpdate = async (id: string, data: { label: string; amount: number; gst_type: GstType }) => {
    try {
      await updateLineItemAsync({ id, ...data });
    } catch (error) {
      // Error handled by the hook
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteLineItemAsync(id);
    } catch (error) {
      // Error handled by the hook
    }
  };

  // Calculate preview values
  const numericAmount = Math.abs(parseFloat(amount) || 0);
  const breakdown = calculateGstBreakdown(numericAmount, gstType);

  // Calculate total from all line items
  const calculateTotals = () => {
    let subtotal = 0;
    let totalGst = 0;

    for (const item of lineItems) {
      const itemBreakdown = calculateGstBreakdown(Math.abs(item.amount), item.gst_type);
      if (item.amount >= 0) {
        subtotal += item.gst_type === 'addition' ? itemBreakdown.total : Math.abs(item.amount);
        totalGst += itemBreakdown.gst;
      } else {
        subtotal -= item.gst_type === 'addition' ? itemBreakdown.total : Math.abs(item.amount);
        totalGst -= itemBreakdown.gst;
      }
    }

    return { subtotal, totalGst };
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Items</DialogTitle>
          <DialogDescription>
            Manage payment items for {comedianName ? `${comedianName}'s` : 'this'} booking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Line Items */}
          {lineItems.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Items</Label>
              <div className="space-y-2">
                {lineItems.map((item) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    isUpdating={isUpdating}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
              {/* Totals Summary */}
              <div className="flex justify-end gap-4 pt-2 border-t text-sm">
                <span className="text-muted-foreground">Total GST:</span>
                <span className="font-medium tabular-nums">{formatCurrency(totals.totalGst)}</span>
                <span className="text-muted-foreground">Net Total:</span>
                <span className={cn(
                  'font-medium tabular-nums',
                  totals.subtotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                )}>
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
            </div>
          )}

          {lineItems.length > 0 && <Separator />}

          {/* Add New Item Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Label className="text-sm font-medium">Add New Item</Label>

            {/* Quick presets */}
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">Quick Add</Label>
              <div className="flex flex-wrap gap-2">
                {LINE_ITEM_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={label === preset.label ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => handlePreset(preset)}
                    className="h-7 text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Label field */}
            <div className="grid gap-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Travel Allowance"
              />
            </div>

            {/* Amount field with +/- toggle */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <div className="flex gap-2">
                <div className="flex rounded-md border divide-x">
                  <Button
                    type="button"
                    variant={!isNegative ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-9 rounded-r-none border-0',
                      !isNegative && 'bg-green-600 hover:bg-green-700'
                    )}
                    onClick={() => setIsNegative(false)}
                  >
                    +
                  </Button>
                  <Button
                    type="button"
                    variant={isNegative ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-9 rounded-l-none border-0',
                      isNegative && 'bg-red-600 hover:bg-red-700'
                    )}
                    onClick={() => setIsNegative(true)}
                  >
                    -
                  </Button>
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {isNegative
                  ? 'This will be deducted from the total (e.g., merch, commission)'
                  : 'This will be added to the total (e.g., fee, travel)'}
              </p>
            </div>

            {/* GST Options */}
            <div className="grid gap-2">
              <Label>GST</Label>
              <RadioGroup
                value={gstType}
                onValueChange={(value) => setGstType(value as GstType)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excluded" id="gst-excluded" />
                  <Label htmlFor="gst-excluded" className="cursor-pointer font-normal">
                    Excluded
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="included" id="gst-included" />
                  <Label htmlFor="gst-included" className="cursor-pointer font-normal">
                    Included
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="addition" id="gst-addition" />
                  <Label htmlFor="gst-addition" className="cursor-pointer font-normal">
                    + GST
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                {gstType === 'excluded' && 'No GST applies to this item'}
                {gstType === 'included' && 'GST is already included in the amount'}
                {gstType === 'addition' && 'GST will be added on top (10%)'}
              </p>
            </div>

            {/* Preview */}
            {label && amount && (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="space-y-1">
                  {gstType === 'excluded' ? (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          isNegative
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        )}
                      >
                        {isNegative ? '-' : ''}${numericAmount.toFixed(2)} {label}
                      </Badge>
                    </div>
                  ) : gstType === 'included' ? (
                    <div className="text-sm">
                      <span className={cn(
                        'font-medium',
                        isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      )}>
                        {isNegative ? '-' : ''}${numericAmount.toFixed(2)} {label}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        (${breakdown.base.toFixed(2)} + GST ${breakdown.gst.toFixed(2)})
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <span className={cn(
                        'font-medium',
                        isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      )}>
                        {isNegative ? '-' : ''}${breakdown.total.toFixed(2)} {label}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        (${numericAmount.toFixed(2)} + GST ${breakdown.gst.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
              >
                Close
              </Button>
              <Button type="submit" disabled={isAdding || !label || !amount}>
                {isAdding ? 'Adding...' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddLineItemDialog;
