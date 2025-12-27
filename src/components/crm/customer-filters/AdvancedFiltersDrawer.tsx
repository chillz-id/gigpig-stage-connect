import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import type { CustomerFilters } from '@/hooks/useCustomers';
import { format } from 'date-fns';

interface AdvancedFiltersDrawerProps {
  isOpen: boolean;
  filters: CustomerFilters;
  sources: string[] | undefined;
  onReset: () => void;
  onSourceChange: (source: string) => void;
  onMinSpentChange: (value: number | undefined) => void;
  onMaxSpentChange: (value: number | undefined) => void;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  activeFilterCount: number;
}

export const AdvancedFiltersDrawer = ({
  isOpen,
  filters,
  sources,
  onReset,
  onSourceChange,
  onMinSpentChange,
  onMaxSpentChange,
  onDateFromChange,
  onDateToChange,
  activeFilterCount,
}: AdvancedFiltersDrawerProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Advanced Filters</h3>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Source</Label>
          <Select value={filters.source || 'all'} onValueChange={onSourceChange}>
            <SelectTrigger>
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources?.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Min Spent ($)</Label>
          <Input
            type="number"
            placeholder="0"
            value={filters.minSpent ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              onMinSpentChange(value ? Number(value) : undefined);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Max Spent ($)</Label>
          <Input
            type="number"
            placeholder="No limit"
            value={filters.maxSpent ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              onMaxSpentChange(value ? Number(value) : undefined);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Last Order From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="professional-button w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(new Date(filters.dateFrom), 'PP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                onSelect={onDateFromChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Last Order To</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="professional-button w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(new Date(filters.dateTo), 'PP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                onSelect={onDateToChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};
