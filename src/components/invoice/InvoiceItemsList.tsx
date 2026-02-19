/**
 * Invoice Items List Component
 *
 * Handles invoice line items with:
 * - Per-item GST treatment (Included, Excluded, No GST)
 * - Deductions support (negative amounts, red styling)
 * - Visual grouping: Items section, then Deductions section
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InvoiceItem, GstTreatment } from '@/hooks/useInvoiceFormState';

interface InvoiceItemsListProps {
  items: InvoiceItem[];
  onAddItem: () => void;
  onAddDeduction: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, field: keyof InvoiceItem, value: string | number | boolean) => void;
  subtotal: number;
  defaultGstTreatment?: GstTreatment;
}

const gstOptions: { value: GstTreatment; label: string; description: string }[] = [
  { value: 'gst_included', label: 'GST Included', description: 'Total includes 10% GST' },
  { value: 'gst_excluded', label: 'GST Excluded', description: '10% GST added on top' },
  { value: 'no_gst', label: 'No GST', description: 'No GST applied' },
];

export const InvoiceItemsList: React.FC<InvoiceItemsListProps> = ({
  items,
  onAddItem,
  onAddDeduction,
  onRemoveItem,
  onUpdateItem,
  subtotal,
  defaultGstTreatment = 'no_gst',
}) => {
  // Separate items and deductions
  const regularItems = items.filter(item => !item.isDeduction);
  const deductions = items.filter(item => item.isDeduction);

  const renderItem = (item: InvoiceItem, isDeduction: boolean) => {
    const displayTotal = isDeduction ? -Math.abs(item.total) : item.total;

    return (
      <div
        key={item.id}
        className={cn(
          'grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border rounded-lg',
          isDeduction
            ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
            : 'border-border bg-muted/50'
        )}
      >
        {/* Description - 4 cols */}
        <div className="md:col-span-4">
          <Label htmlFor={`description-${item.id}`} className="sr-only">
            Description
          </Label>
          <Input
            id={`description-${item.id}`}
            placeholder={isDeduction ? 'Deduction description' : 'Item description'}
            value={item.description}
            onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
            className={cn(
              'w-full',
              isDeduction && 'border-red-200 dark:border-red-900'
            )}
          />
        </div>

        {/* Quantity - 1 col */}
        <div className="md:col-span-1">
          <Label htmlFor={`quantity-${item.id}`} className="md:sr-only text-xs text-muted-foreground">
            Qty
          </Label>
          <Input
            id={`quantity-${item.id}`}
            type="number"
            placeholder="Qty"
            min="1"
            value={item.quantity}
            onChange={(e) => onUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
            className={cn(
              'w-full',
              isDeduction && 'border-red-200 dark:border-red-900'
            )}
          />
        </div>

        {/* Rate - 2 cols */}
        <div className="md:col-span-2">
          <Label htmlFor={`rate-${item.id}`} className="md:sr-only text-xs text-muted-foreground">
            Rate
          </Label>
          <div className="relative">
            <span className={cn(
              'absolute left-3 top-1/2 transform -translate-y-1/2',
              isDeduction ? 'text-red-500' : 'text-gray-500'
            )}>
              {isDeduction ? '-$' : '$'}
            </span>
            <Input
              id={`rate-${item.id}`}
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={item.rate === 0 ? '' : Math.abs(item.rate)}
              onChange={(e) => onUpdateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
              className={cn(
                'pl-8 w-full',
                isDeduction && 'border-red-200 dark:border-red-900'
              )}
            />
          </div>
        </div>

        {/* GST Treatment - 2 cols */}
        <div className="md:col-span-2">
          <Label htmlFor={`gst-${item.id}`} className="md:sr-only text-xs text-muted-foreground">
            GST
          </Label>
          <Select
            value={item.gstTreatment}
            onValueChange={(value: GstTreatment) => onUpdateItem(item.id, 'gstTreatment', value)}
          >
            <SelectTrigger
              id={`gst-${item.id}`}
              className={cn(
                'w-full text-xs',
                isDeduction && 'border-red-200 dark:border-red-900'
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {gstOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-muted-foreground text-xs">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Total - 2 cols */}
        <div className="md:col-span-2">
          <div className={cn(
            'h-9 flex items-center px-3 rounded-md text-sm font-medium',
            isDeduction
              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
              : 'bg-muted'
          )}>
            {isDeduction ? '-' : ''}${Math.abs(item.total).toFixed(2)}
          </div>
        </div>

        {/* Remove button - 1 col */}
        <div className="md:col-span-1 flex justify-end">
          {items.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveItem(item.id)}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Add buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-medium">Invoice Items</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            className="professional-button flex items-center gap-2"
            size="sm"
            onClick={onAddItem}
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAddDeduction}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Minus className="h-4 w-4" />
            Add Deduction
          </Button>
        </div>
      </div>

      {/* Column Headers - visible on desktop */}
      <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 pb-2 text-xs font-medium text-muted-foreground">
        <div className="md:col-span-4">Description</div>
        <div className="md:col-span-1">Qty</div>
        <div className="md:col-span-2">Rate</div>
        <div className="md:col-span-2">GST</div>
        <div className="md:col-span-2">Total</div>
        <div className="md:col-span-1"></div>
      </div>

      {/* Regular Items */}
      {regularItems.length > 0 && (
        <div className="space-y-3">
          {regularItems.map(item => renderItem(item, false))}
        </div>
      )}

      {/* Deductions Section */}
      {deductions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-red-600 mt-4">
            <Minus className="h-4 w-4" />
            Deductions
          </div>
          {deductions.map(item => renderItem(item, true))}
        </div>
      )}

      {/* Subtotal */}
      <div className="flex justify-end">
        <div className="w-72 space-y-2">
          <div className="flex justify-between items-center text-sm border-t pt-2">
            <span className="font-medium">Subtotal:</span>
            <span className={cn(
              'font-semibold',
              subtotal < 0 && 'text-red-600'
            )}>
              {subtotal < 0 ? '-' : ''}${Math.abs(subtotal).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceItemsList;
