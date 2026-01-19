import React from 'react';
import { Calendar, Filter, SortAsc, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface EventFiltersProps {
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Status filter
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  
  // Location filter
  locationFilter: string;
  setLocationFilter: (location: string) => void;
  
  // Type filter
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  
  // Sort
  sortBy: string;
  setSortBy: (sort: string) => void;
  
  // Date range
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  
  // Clear all filters
  onClearFilters: () => void;
  
  // Active filters count
  activeFiltersCount?: number;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  locationFilter,
  setLocationFilter,
  typeFilter,
  setTypeFilter,
  sortBy,
  setSortBy,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  activeFiltersCount = 0
}) => {
  const { theme } = useTheme();
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/[0.08] backdrop-blur-md border-white/[0.20]';
    }
    return 'bg-gray-800/60 backdrop-blur-md border-gray-600';
  };

  const getSelectStyles = () => {
    if (theme === 'pleasure') {
      return "bg-white/[0.08] border-0 backdrop-blur-md text-white shadow-lg shadow-black/10";
    }
    return "bg-gray-800/60 border-0 backdrop-blur-md text-gray-100 shadow-lg shadow-black/20";
  };

  const getSelectContentStyles = () => {
    if (theme === 'pleasure') {
      return "bg-white/[0.12] backdrop-blur-md border-white/[0.20] text-white rounded-xl";
    }
    return "bg-gray-800/90 border-gray-600 text-gray-100 rounded-xl";
  };

  const getBadgeStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
    }
    return 'bg-red-600/20 text-red-200 border-red-600/30';
  };

  const getButtonStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/10 hover:bg-white/20 text-white border-white/20';
    }
    return 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600';
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
          <Input
            placeholder="Search by event name or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className={cn("p-4 rounded-xl border", getCardStyles())}>
          <div className="space-y-4">
            {/* Row 1: Status and Sort */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <Label className="text-white/80 mb-2 block">Event Status</Label>
                <RadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="status-all" />
                      <Label htmlFor="status-all" className="text-white/80 cursor-pointer">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="open" id="status-open" />
                      <Label htmlFor="status-open" className="text-white/80 cursor-pointer">Open</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="closed" id="status-closed" />
                      <Label htmlFor="status-closed" className="text-white/80 cursor-pointer">Closed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="draft" id="status-draft" />
                      <Label htmlFor="status-draft" className="text-white/80 cursor-pointer">Draft</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cancelled" id="status-cancelled" />
                      <Label htmlFor="status-cancelled" className="text-white/80 cursor-pointer">Cancelled</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="completed" id="status-completed" />
                      <Label htmlFor="status-completed" className="text-white/80 cursor-pointer">Completed</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Sort Options */}
              <div>
                <Label className="text-white/80 mb-2 block">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className={cn("w-full rounded-xl", getSelectStyles())}>
                    <div className="flex items-center gap-2">
                      <SortAsc className="w-4 h-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className={getSelectContentStyles()}>
                    <SelectItem value="date">Date (Nearest First)</SelectItem>
                    <SelectItem value="date-desc">Date (Latest First)</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    <SelectItem value="popularity">Most Popular</SelectItem>
                    <SelectItem value="applications">Most Applications</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Location and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Filter */}
              <div>
                <Label className="text-white/80 mb-2 block">Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className={cn("w-full rounded-xl", getSelectStyles())}>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent className={getSelectContentStyles()}>
                    <SelectItem value="">All Locations</SelectItem>
                    <SelectItem value="Sydney">Sydney, NSW</SelectItem>
                    <SelectItem value="Melbourne">Melbourne, VIC</SelectItem>
                    <SelectItem value="Brisbane">Brisbane, QLD</SelectItem>
                    <SelectItem value="Perth">Perth, WA</SelectItem>
                    <SelectItem value="Adelaide">Adelaide, SA</SelectItem>
                    <SelectItem value="Gold Coast">Gold Coast, QLD</SelectItem>
                    <SelectItem value="Newcastle">Newcastle, NSW</SelectItem>
                    <SelectItem value="Canberra">Canberra, ACT</SelectItem>
                    <SelectItem value="Hobart">Hobart, TAS</SelectItem>
                    <SelectItem value="Darwin">Darwin, NT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <Label className="text-white/80 mb-2 block">Event Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className={cn("w-full rounded-xl", getSelectStyles())}>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className={getSelectContentStyles()}>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="open_mic">Open Mic</SelectItem>
                    <SelectItem value="showcase">Showcase</SelectItem>
                    <SelectItem value="headliner">Headliner</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="special">Special Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Date Range */}
            <div>
              <Label className="text-white/80 mb-2 block">Date Range</Label>
              <div className="flex items-center gap-4">
                <DateRangePicker
                  value={dateRange}
                  onChange={onDateRangeChange}
                  className="flex-1"
                />
                {(dateRange.start || dateRange.end) && (
                  <Button
                    onClick={() => onDateRangeChange({ start: null, end: null })}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {(dateRange.start || dateRange.end) && (
                <p className="mt-2 text-sm text-white/60">
                  {dateRange.start && `From ${dateRange.start.toLocaleDateString()}`}
                  {dateRange.start && dateRange.end && ' to '}
                  {dateRange.end && !dateRange.start && 'Until '}
                  {dateRange.end && dateRange.end.toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex justify-end pt-2 border-t border-white/10">
                <Button
                  onClick={onClearFilters}
                  variant="ghost"
                  className="text-white/60 hover:text-white"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};