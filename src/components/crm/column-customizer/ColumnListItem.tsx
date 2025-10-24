import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { OrderedColumnEntry } from '@/hooks/crm/useColumnOrdering';
import type { ColumnAlignment } from '@/types/column-config';

const ALIGNMENT_OPTIONS: { value: ColumnAlignment; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

interface ColumnListItemProps {
  entry: OrderedColumnEntry;
  isFirst: boolean;
  isLast: boolean;
  onToggleVisibility: (columnId: string) => void;
  onMove: (columnId: string, direction: 'up' | 'down') => void;
  onWidthChange: (columnId: string, width: number) => void;
  onAlignmentChange: (columnId: string, alignment: ColumnAlignment) => void;
}

export const ColumnListItem = ({
  entry,
  isFirst,
  isLast,
  onToggleVisibility,
  onMove,
  onWidthChange,
  onAlignmentChange,
}: ColumnListItemProps) => {
  const { config, definition } = entry;
  const alignmentValue = config.alignment ?? definition.alignment ?? 'left';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`column-${definition.id}`}
            checked={config.visible}
            onCheckedChange={() => onToggleVisibility(definition.id)}
            disabled={definition.required}
          />
          <Label htmlFor={`column-${definition.id}`} className="cursor-pointer font-medium">
            {definition.label}
            {definition.required && <span className="ml-1 text-xs text-muted-foreground">(Required)</span>}
          </Label>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onMove(definition.id, 'up')}
            disabled={isFirst}
            aria-label={`Move ${definition.label} up`}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onMove(definition.id, 'down')}
            disabled={isLast}
            aria-label={`Move ${definition.label} down`}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="ml-6 space-y-2">
        {config.visible && (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor={`width-${definition.id}`} className="text-sm text-muted-foreground">
                Width
              </Label>
              <span className="text-sm font-medium">{config.width}px</span>
            </div>
            <Slider
              id={`width-${definition.id}`}
              min={definition.minWidth}
              max={500}
              step={10}
              value={[config.width]}
              onValueChange={(value) => onWidthChange(definition.id, value[0] ?? definition.minWidth)}
            />
            {config.width === definition.minWidth && (
              <span className="text-xs text-muted-foreground">Minimum width {definition.minWidth}px</span>
            )}
          </>
        )}
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Alignment</Label>
          <Select
            value={alignmentValue}
            onValueChange={(value) => onAlignmentChange(definition.id, value as ColumnAlignment)}
          >
            <SelectTrigger className="h-8 w-[110px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {ALIGNMENT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
