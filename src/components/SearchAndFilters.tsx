
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/DateRangePicker';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface SearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  showDateRange?: boolean;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  locationFilter,
  setLocationFilter,
  typeFilter,
  setTypeFilter,
  dateRange = { start: null, end: null },
  onDateRangeChange,
  showDateRange = false,
}) => {
  const { theme } = useTheme();

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

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
          <Input
            placeholder="Search shows, venues, or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Date Range Picker */}
        {showDateRange && onDateRangeChange && (
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            className="w-full md:w-64"
          />
        )}
        
        <Select onValueChange={setLocationFilter}>
          <SelectTrigger className={cn("w-full md:w-48 rounded-xl", getSelectStyles())}>
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent className={getSelectContentStyles()}>
            <SelectItem value="all">All Locations</SelectItem>
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
            <SelectItem value="Wollongong">Wollongong, NSW</SelectItem>
            <SelectItem value="Cairns">Cairns, QLD</SelectItem>
            <SelectItem value="Geelong">Geelong, VIC</SelectItem>
            <SelectItem value="Townsville">Townsville, QLD</SelectItem>
            <SelectItem value="Launceston">Launceston, TAS</SelectItem>
            <SelectItem value="Bendigo">Bendigo, VIC</SelectItem>
            <SelectItem value="Ballarat">Ballarat, VIC</SelectItem>
            <SelectItem value="Mackay">Mackay, QLD</SelectItem>
            <SelectItem value="Rockhampton">Rockhampton, QLD</SelectItem>
            <SelectItem value="Toowoomba">Toowoomba, QLD</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={setTypeFilter}>
          <SelectTrigger className={cn("w-full md:w-48 rounded-xl", getSelectStyles())}>
            <SelectValue placeholder="Show Type" />
          </SelectTrigger>
          <SelectContent className={getSelectContentStyles()}>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="open mic">Open Mic</SelectItem>
            <SelectItem value="semi-pro">Semi-Pro</SelectItem>
            <SelectItem value="pro">Professional</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
