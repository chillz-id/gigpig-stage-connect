import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import type { CustomerActivity } from '@/hooks/useCustomerActivity';
import { formatCurrency } from '@/utils/formatters';

interface OrderActivityProps {
  metadata: CustomerActivity['metadata'];
}

export const OrderActivity = ({ metadata }: OrderActivityProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Order Placed</h4>
        {metadata.total_cents && (
          <Badge variant="secondary" className="font-semibold">
            {formatCurrency(metadata.total_cents / 100)}
          </Badge>
        )}
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">
        {metadata.order_reference && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Order #:</span>
            <code className="rounded bg-muted px-2 py-0.5 text-xs">
              {metadata.order_reference}
            </code>
          </div>
        )}
        {metadata.status && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <Badge variant="outline">{metadata.status}</Badge>
          </div>
        )}
        {metadata.source && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Source:</span>
            <span className="capitalize">{metadata.source}</span>
          </div>
        )}
        {metadata.purchaser_name && (
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span>{metadata.purchaser_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};
