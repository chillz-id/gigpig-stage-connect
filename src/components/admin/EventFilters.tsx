
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { DateRangePicker } from '@/components/DateRangePicker';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface EventFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateRange?: DateRange;
  setDateRange?: (range: DateRange) => void;
}

const EventFilters = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, dateRange, setDateRange }: EventFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 form-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-300 h-11 text-base md:text-sm md:h-10"
        />
      </div>
      {dateRange && setDateRange && (
        <div className="w-full md:w-64">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-full"
          />
        </div>
      )}
      <div className="w-full md:w-48">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full bg-white/20 border-white/30 text-white h-11 text-base md:text-sm md:h-10">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600 z-[9999]">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Status</SelectItem>
            <SelectItem value="open" className="text-white hover:bg-gray-700">Open</SelectItem>
            <SelectItem value="ongoing" className="text-white hover:bg-gray-700">Ongoing</SelectItem>
            <SelectItem value="completed" className="text-white hover:bg-gray-700">Completed</SelectItem>
            <SelectItem value="cancelled" className="text-white hover:bg-gray-700">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default EventFilters;
