import React from 'react';
import { Invoice } from '@/types/invoice';
import { InvoiceCard } from './InvoiceCard';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface InvoiceCardWithSelectionProps {
  invoice: Invoice;
  isSelected: boolean;
  onSelect: (invoiceId: string) => void;
  onDelete: (invoiceId: string) => Promise<void>;
  onView: (invoice: Invoice) => void;
  isSelectionMode: boolean;
}

export const InvoiceCardWithSelection: React.FC<InvoiceCardWithSelectionProps> = ({
  invoice,
  isSelected,
  onSelect,
  onDelete,
  onView,
  isSelectionMode
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking on the checkbox area, toggle selection
    const target = e.target as HTMLElement;
    if (target.closest('.selection-checkbox') || isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      onSelect(invoice.id);
    }
  };

  return (
    <div 
      className={cn(
        "relative transition-all duration-200",
        isSelected && "ring-2 ring-primary ring-offset-2",
        isSelectionMode && "cursor-pointer hover:bg-accent/50"
      )}
      onClick={handleCardClick}
    >
      {/* Selection checkbox */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 selection-checkbox">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(invoice.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-5 w-5"
        />
      </div>

      {/* Invoice card with left padding for checkbox */}
      <div className={cn(
        "transition-all duration-200",
        isSelectionMode ? "pl-12" : "pl-0"
      )}>
        <InvoiceCard
          invoice={invoice}
          onDelete={onDelete}
          onView={() => onView(invoice)}
        />
      </div>
    </div>
  );
};