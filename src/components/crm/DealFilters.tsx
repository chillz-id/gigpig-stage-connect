import { DealFilters as DealFiltersType, DealType } from '@/hooks/useDeals';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Filter, X, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DealFiltersProps {
  filters: Omit<DealFiltersType, 'status'>; // Status is handled by kanban columns
  onFiltersChange: (filters: Omit<DealFiltersType, 'status'>) => void;
  onReset: () => void;
}

/**
 * DealFilters Component
 *
 * Filtering UI for deals:
 * - Deal type (booking, performance, collaboration, sponsorship)
 * - Performance date range
 * - Artist/Promoter/Agency filters (coming soon)
 */
export const DealFilters = ({
  filters,
  onFiltersChange,
  onReset,
}: DealFiltersProps) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const dealTypes: Array<{ value: DealType; label: string }> = [
    { value: 'booking', label: 'Booking' },
    { value: 'performance', label: 'Performance' },
    { value: 'collaboration', label: 'Collaboration' },
    { value: 'sponsorship', label: 'Sponsorship' },
  ];

  const handleDealTypeChange = (dealType: string) => {
    onFiltersChange({
      ...filters,
      dealType: dealType === 'all' ? undefined : (dealType as DealType),
    });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateFrom: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateTo: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof typeof filters] !== undefined
  ).length;

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <Button
          variant={!filters.dealType ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleDealTypeChange('all')}
        >
          All Deals
        </Button>

        {dealTypes.map(({ value, label }) => (
          <Button
            key={value}
            variant={filters.dealType === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleDealTypeChange(value)}
          >
            {label}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          More Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Advanced Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Deal Type Dropdown */}
            <div className="space-y-2">
              <Label>Deal Type</Label>
              <Select
                value={filters.dealType || 'all'}
                onValueChange={handleDealTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {dealTypes.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Performance Date From */}
            <div className="space-y-2">
              <Label>Performance Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dateFrom
                      ? format(new Date(filters.dateFrom), 'PP')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={
                      filters.dateFrom ? new Date(filters.dateFrom) : undefined
                    }
                    onSelect={handleDateFromChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Performance Date To */}
            <div className="space-y-2">
              <Label>Performance Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dateTo
                      ? format(new Date(filters.dateTo), 'PP')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                    onSelect={handleDateToChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.dealType && (
            <Badge variant="secondary">
              Type: {filters.dealType}
              <button
                onClick={() => onFiltersChange({ ...filters, dealType: undefined })}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.dateFrom && (
            <Badge variant="secondary">
              From: {format(new Date(filters.dateFrom), 'PP')}
              <button
                onClick={() => onFiltersChange({ ...filters, dateFrom: undefined })}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="secondary">
              To: {format(new Date(filters.dateTo), 'PP')}
              <button
                onClick={() => onFiltersChange({ ...filters, dateTo: undefined })}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

// Add missing import
import { useState } from 'react';
