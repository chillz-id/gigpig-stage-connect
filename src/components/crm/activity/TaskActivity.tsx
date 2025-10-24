import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock } from 'lucide-react';
import type { CustomerActivity } from '@/hooks/useCustomerActivity';
import { formatDateTime } from '@/utils/formatters';

interface TaskActivityProps {
  metadata: CustomerActivity['metadata'];
}

export const TaskActivity = ({ metadata }: TaskActivityProps) => (
  <div className="space-y-2">
    <h4 className="font-semibold">Task Activity</h4>
    <div className="space-y-1 text-sm text-muted-foreground">
      {metadata.title && (
        <div className="flex items-center gap-2">
          <CheckSquare className="h-3 w-3" />
          <span className="font-medium">{metadata.title}</span>
        </div>
      )}
      {metadata.status && (
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <Badge variant="outline">{metadata.status}</Badge>
        </div>
      )}
      {metadata.priority && (
        <div className="flex items-center gap-2">
          <span className="font-medium">Priority:</span>
          <Badge variant={metadata.priority === 'high' ? 'destructive' : 'secondary'}>
            {metadata.priority}
          </Badge>
        </div>
      )}
      {metadata.due_date && (
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>Due: {formatDateTime(metadata.due_date)}</span>
        </div>
      )}
    </div>
  </div>
);
