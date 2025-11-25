import { Badge } from '@/components/ui/badge';
import type { CustomerActivity } from '@/hooks/useCustomerActivity';
import { formatCurrency } from '@/utils/formatters';

interface DealActivityProps {
  metadata: CustomerActivity['metadata'];
}

export const DealActivity = ({ metadata }: DealActivityProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <h4 className="font-semibold">Deal Activity</h4>
      {metadata.proposed_fee && (
        <Badge variant="secondary" className="font-semibold">
          {formatCurrency(metadata.proposed_fee)}
        </Badge>
      )}
    </div>
    <div className="space-y-1 text-sm text-muted-foreground">
      {metadata.deal_type && (
        <div className="flex items-center gap-2">
          <span className="font-medium">Type:</span>
          <span className="capitalize">{metadata.deal_type}</span>
        </div>
      )}
      {metadata.status && (
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <Badge className="professional-button">{metadata.status}</Badge>
        </div>
      )}
      {metadata.negotiation_stage && (
        <div className="flex items-center gap-2">
          <span className="font-medium">Stage:</span>
          <span className="capitalize">{metadata.negotiation_stage}</span>
        </div>
      )}
    </div>
  </div>
);
