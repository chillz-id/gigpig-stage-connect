import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter } from 'lucide-react';
import { GigType } from './GigPill';

interface EventTypeFilterProps {
  selectedTypes: GigType[];
  onChange: (types: GigType[]) => void;
}

export function EventTypeFilter({ selectedTypes, onChange }: EventTypeFilterProps) {
  const eventTypes: { type: GigType; label: string; color: string }[] = [
    { type: 'confirmed', label: 'Confirmed', color: 'bg-green-600' },
    { type: 'personal', label: 'Personal', color: 'bg-blue-600' },
    { type: 'pending', label: 'Pending', color: 'bg-orange-600' },
  ];

  const toggleType = (type: GigType) => {
    if (selectedTypes.includes(type)) {
      // Don't allow deselecting all - must have at least 1 selected
      if (selectedTypes.length > 1) {
        onChange(selectedTypes.filter(t => t !== type));
      }
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter ({selectedTypes.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Event Types</h4>
          {eventTypes.map(({ type, label, color }) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={type}
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => toggleType(type)}
              />
              <label htmlFor={type} className="flex items-center gap-2 text-sm cursor-pointer">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                {label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
