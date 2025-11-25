import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import type { SegmentCount } from '@/hooks/useCustomers';

interface SegmentFilterProps {
  segmentCounts: SegmentCount[] | undefined;
  selectedSegments: string[];
  onToggleSegment: (segment: string) => void;
  onClearSegments: () => void;
  onCreateSegment: () => void;
  isCreatingSegment: boolean;
  totalCustomerCount?: number;
}

export const SegmentFilter = ({
  segmentCounts,
  selectedSegments,
  onToggleSegment,
  onClearSegments,
  onCreateSegment,
  isCreatingSegment,
  totalCustomerCount,
}: SegmentFilterProps) => {
  // Use the actual total customer count (all customers) instead of sum of segments
  // This ensures ALL shows all customers (15,549) not just those with segments (9,369)
  const displayCount = totalCustomerCount ?? segmentCounts?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedSegments.length === 0 ? 'default' : 'secondary'}
        size="sm"
        onClick={onClearSegments}
      >
        All
        {displayCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {displayCount.toLocaleString('en-AU')}
          </Badge>
        )}
      </Button>

      {segmentCounts?.map((segment) => (
        <Button
          key={segment.slug}
          variant={selectedSegments.includes(segment.slug) ? 'default' : 'secondary'}
          size="sm"
          onClick={() => onToggleSegment(segment.slug)}
        >
          {segment.name}
          <Badge variant="secondary" className="ml-2">
            {segment.count}
          </Badge>
        </Button>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCreateSegment}
        className="gap-2"
        disabled={isCreatingSegment}
      >
        <Plus className="h-4 w-4" />
        New Segment
      </Button>
    </div>
  );
};
