import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { CustomerFilters as CustomerFiltersType } from '@/hooks/useCustomers';
import { useCustomerSegmentCounts, useCustomerSources } from '@/hooks/useCustomers';
import { useSegmentManager } from '@/hooks/crm/useSegmentManager';
import { CustomerSearchBar } from '@/components/crm/customer-filters/CustomerSearchBar';
import { SegmentFilter } from '@/components/crm/customer-filters/SegmentFilter';
import { AdvancedFiltersDrawer } from '@/components/crm/customer-filters/AdvancedFiltersDrawer';
import { CreateSegmentDialog } from '@/components/crm/customer-filters/CreateSegmentDialog';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface CustomerFiltersProps {
  filters: CustomerFiltersType;
  onFiltersChange: (filters: CustomerFiltersType) => void;
  onReset: () => void;
  onExportSegment?: (segmentSlug: string) => void;
  isExporting?: boolean;
  totalCustomerCount?: number;
}

export const CustomerFilters = ({ filters, onFiltersChange, onReset, onExportSegment, isExporting, totalCustomerCount }: CustomerFiltersProps) => {
  const { data: segmentCounts } = useCustomerSegmentCounts();
  const { data: sources } = useCustomerSources();

  const selectedSegments = filters.segments ?? [];
  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    setSearchInput(filters.search ?? '');
  }, [filters.search]);

  const segmentManager = useSegmentManager({
    onSegmentCreated: (segment) => {
      const nextFilters: CustomerFiltersType = { ...filters };
      const nextSegments = new Set(selectedSegments);
      nextSegments.add(segment.slug);
      nextFilters.segments = Array.from(nextSegments);
      onFiltersChange(nextFilters);
    },
  });

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFilters: CustomerFiltersType = { ...filters };
    if (searchInput) {
      nextFilters.search = searchInput;
    } else {
      delete nextFilters.search;
    }
    onFiltersChange(nextFilters);
  };

  const toggleSegment = (segment: string) => {
    const current = new Set(selectedSegments);
    if (current.has(segment)) {
      current.delete(segment);
    } else {
      current.add(segment);
    }
    const next = Array.from(current);
    const nextFilters: CustomerFiltersType = { ...filters };
    if (next.length > 0) {
      nextFilters.segments = next;
    } else {
      delete nextFilters.segments;
    }
    onFiltersChange(nextFilters);
  };

  const clearSegments = () => {
    if (!filters.segments) return;
    const nextFilters: CustomerFiltersType = { ...filters };
    delete nextFilters.segments;
    onFiltersChange(nextFilters);
  };

  const handleSourceChange = (source: string) => {
    const nextFilters: CustomerFiltersType = { ...filters };
    if (source === 'all') {
      delete nextFilters.source;
    } else {
      nextFilters.source = source;
    }
    onFiltersChange(nextFilters);
  };

  const handleMinSpentChange = (value: number | undefined) => {
    const nextFilters: CustomerFiltersType = { ...filters };
    if (value === undefined) {
      delete nextFilters.minSpent;
    } else {
      nextFilters.minSpent = value;
    }
    onFiltersChange(nextFilters);
  };

  const handleMaxSpentChange = (value: number | undefined) => {
    const nextFilters: CustomerFiltersType = { ...filters };
    if (value === undefined) {
      delete nextFilters.maxSpent;
    } else {
      nextFilters.maxSpent = value;
    }
    onFiltersChange(nextFilters);
  };

  const handleDateFromChange = (date: Date | undefined) => {
    const nextFilters: CustomerFiltersType = { ...filters };
    if (date) {
      nextFilters.dateFrom = format(date, 'yyyy-MM-dd');
    } else {
      delete nextFilters.dateFrom;
    }
    onFiltersChange(nextFilters);
  };

  const handleDateToChange = (date: Date | undefined) => {
    const nextFilters: CustomerFiltersType = { ...filters };
    if (date) {
      nextFilters.dateTo = format(date, 'yyyy-MM-dd');
    } else {
      delete nextFilters.dateTo;
    }
    onFiltersChange(nextFilters);
  };

  const handleReset = () => {
    onReset();
    setSearchInput('');
    clearSegments();
  };

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'segments') {
        return Array.isArray(value) && value.length > 0 ? count + 1 : count;
      }
      return value === undefined || value === null ? count : count + 1;
    }, 0);
  }, [filters]);

  return (
    <div className="space-y-4">
      <CustomerSearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSubmit={handleSearchSubmit}
        onToggleAdvanced={() => setShowAdvancedFilters((previous) => !previous)}
        isAdvancedOpen={showAdvancedFilters}
        activeFilterCount={activeFilterCount}
      />

      <SegmentFilter
        segmentCounts={segmentCounts}
        selectedSegments={selectedSegments}
        onClearSegments={clearSegments}
        onToggleSegment={toggleSegment}
        onCreateSegment={segmentManager.openDialog}
        onExportSegment={onExportSegment}
        isCreatingSegment={segmentManager.isSubmitting}
        isExporting={isExporting}
        totalCustomerCount={totalCustomerCount}
      />

      <AdvancedFiltersDrawer
        isOpen={showAdvancedFilters}
        filters={filters}
        sources={sources}
        onReset={handleReset}
        onSourceChange={handleSourceChange}
        onMinSpentChange={handleMinSpentChange}
        onMaxSpentChange={handleMaxSpentChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        activeFilterCount={activeFilterCount}
      />

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.search && (
            <Badge variant="secondary">
              Search: {filters.search}
              <button
                type="button"
                onClick={() => {
                  const nextFilters: CustomerFiltersType = { ...filters };
                  delete nextFilters.search;
                  onFiltersChange(nextFilters);
                }}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.segments?.map((segment) => (
            <Badge key={segment} variant="secondary">
              Segment: {segment}
              <button type="button" onClick={() => toggleSegment(segment)} className="ml-2 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.source && (
            <Badge variant="secondary">
              Source: {filters.source}
              <button
                type="button"
                onClick={() => handleSourceChange('all')}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.minSpent !== undefined && (
            <Badge variant="secondary">
              Min: ${filters.minSpent}
              <button
                type="button"
                onClick={() => handleMinSpentChange(undefined)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.maxSpent !== undefined && (
            <Badge variant="secondary">
              Max: ${filters.maxSpent}
              <button
                type="button"
                onClick={() => handleMaxSpentChange(undefined)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <CreateSegmentDialog
        open={segmentManager.dialogOpen}
        onOpenChange={segmentManager.setDialogOpen}
        name={segmentManager.form.name}
        color={segmentManager.form.color}
        onNameChange={(value) => segmentManager.updateForm({ name: value })}
        onColorChange={(value) => segmentManager.updateForm({ color: value })}
        onClearColor={segmentManager.clearColour}
        previewColor={segmentManager.previewColor}
        defaultColourSwatch={segmentManager.defaultColourSwatch}
        onSubmit={segmentManager.submit}
        isSubmitting={segmentManager.isSubmitting}
      />
    </div>
  );
};
