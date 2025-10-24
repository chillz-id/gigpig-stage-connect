import { Separator } from '@/components/ui/separator';
import type { ColumnAlignment } from '@/types/column-config';
import type { OrderedColumnEntry } from '@/hooks/crm/useColumnOrdering';
import { ColumnListItem } from './ColumnListItem';

interface ColumnListProps {
  columns: OrderedColumnEntry[];
  onToggleVisibility: (columnId: string) => void;
  onMove: (columnId: string, direction: 'up' | 'down') => void;
  onWidthChange: (columnId: string, width: number) => void;
  onAlignmentChange: (columnId: string, alignment: ColumnAlignment) => void;
}

export const ColumnList = ({
  columns,
  onToggleVisibility,
  onMove,
  onWidthChange,
  onAlignmentChange,
}: ColumnListProps) => {
  const items: React.ReactNode[] = [];
  let hiddenDividerInserted = false;

  columns.forEach((entry, index) => {
    if (!entry.config.visible && !hiddenDividerInserted) {
      hiddenDividerInserted = true;
      items.push(<Separator key="hidden-divider" />);
      items.push(
        <p key="hidden-label" className="text-sm font-medium text-muted-foreground">
          Hidden Columns
        </p>
      );
    }

    items.push(
      <ColumnListItem
        key={entry.definition.id}
        entry={entry}
        isFirst={index === 0}
        isLast={index === columns.length - 1}
        onToggleVisibility={onToggleVisibility}
        onMove={onMove}
        onWidthChange={onWidthChange}
        onAlignmentChange={onAlignmentChange}
      />
    );
  });

  return <div className="space-y-4">{items}</div>;
};
