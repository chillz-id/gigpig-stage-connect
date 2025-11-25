// Invoice Items List Component - Handles item array manipulation
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import type { InvoiceItem } from '@/hooks/useInvoiceFormState';

interface InvoiceItemsListProps {
  items: InvoiceItem[];
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, field: keyof InvoiceItem, value: string | number) => void;
  subtotal: number;
}

export const InvoiceItemsList: React.FC<InvoiceItemsListProps> = ({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  subtotal
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Invoice Items</h3>
        <Button 
          type="button" 
          className="professional-button" 
          size="sm" 
          onClick={onAddItem}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-gray-50"
          >
            {/* Description */}
            <div className="md:col-span-5">
              <Label htmlFor={`description-${item.id}`} className="sr-only">
                Description
              </Label>
              <Input
                id={`description-${item.id}`}
                placeholder="Item description"
                value={item.description}
                onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Quantity */}
            <div className="md:col-span-2">
              <Label htmlFor={`quantity-${item.id}`} className="sr-only">
                Quantity
              </Label>
              <Input
                id={`quantity-${item.id}`}
                type="number"
                placeholder="Qty"
                min="1"
                value={item.quantity}
                onChange={(e) => onUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                className="w-full"
              />
            </div>

            {/* Rate */}
            <div className="md:col-span-2">
              <Label htmlFor={`rate-${item.id}`} className="sr-only">
                Rate
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id={`rate-${item.id}`}
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => onUpdateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                  className="pl-8 w-full"
                />
              </div>
            </div>

            {/* Total */}
            <div className="md:col-span-2">
              <div className="h-9 flex items-center px-3 bg-gray-100 rounded-md text-sm font-medium">
                ${item.total.toFixed(2)}
              </div>
            </div>

            {/* Remove button */}
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
        ))}
      </div>

      {/* Subtotal */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between items-center text-sm border-t pt-2">
            <span className="font-medium">Subtotal:</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceItemsList;