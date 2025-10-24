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
}

export const SegmentFilter = ({
  segmentCounts,
  selectedSegments,
  onToggleSegment,
  onClearSegments,
  onCreateSegment,
  isCreatingSegment,
}: SegmentFilterProps) => {
  const totalCount = segmentCounts?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedSegments.length === 0 ? 'default' : 'outline'}
        size="sm"
        onClick={onClearSegments}
      >
        All
        {segmentCounts && (
          <Badge variant="secondary" className="ml-2">
            {totalCount}
          </Badge>
        )}
      </Button>

      {segmentCounts?.map((segment) => (
        <Button
          key={segment.slug}
          variant={selectedSegments.includes(segment.slug) ? 'default' : 'outline'}
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
