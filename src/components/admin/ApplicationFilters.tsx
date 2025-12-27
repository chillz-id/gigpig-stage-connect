
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '@/hooks/useMobileLayout';

interface ApplicationFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  eventFilter: string;
  setEventFilter: (eventId: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  spotTypeFilter?: string;
  setSpotTypeFilter?: (type: string) => void;
  confirmationFilter?: string;
  setConfirmationFilter?: (status: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  events: Array<{ id: string; title: string }>;
  onClearFilters: () => void;
}

const ApplicationFilters: React.FC<ApplicationFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  eventFilter,
  setEventFilter,
  sortBy,
  setSortBy,
  statusFilter = 'all',
  setStatusFilter,
  spotTypeFilter = 'all',
  setSpotTypeFilter,
  confirmationFilter = 'all',
  setConfirmationFilter,
  dateRange,
  setDateRange,
  events,
  onClearFilters,
}) => {
  const { isMobile } = useMobileLayout();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <div className="bg-white/10 backdrop-blur-sm border-white/20 rounded-lg p-3 sm:p-4 mb-6">
      <div className={cn(
        "grid gap-3 sm:gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"
      )}>
        {/* Search - Always visible */}
        <div className="relative">
          <Search className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", isMobile ? "w-5 h-5" : "w-4 h-4")} />
          <Input
            placeholder="Search comedians..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300",
              isMobile && "h-11 touch-target-44"
            )}
          />
        </div>

        {/* Event Filter - Always visible on mobile */}
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className={cn("bg-white/10 border-white/20 text-white", isMobile && "h-11 touch-target-44")}>
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mobile: Advanced Filters Toggle Button */}
        {isMobile && (
          <Button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="professional-button bg-white/10 border-white/20 text-white hover:bg-white/20 touch-target-44"
          >
            <Filter className="w-5 h-5 mr-2" />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
            {showAdvancedFilters ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
          </Button>
        )}

        {/* Advanced Filters - Hidden on mobile unless toggled */}
        {(!isMobile || showAdvancedFilters) && (
          <>
            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className={cn(
                    "professional-button justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                    !dateRange.from && "text-gray-300",
                    isMobile && "h-11 touch-target-44"
                  )}
                >
                  <CalendarIcon className={cn(isMobile ? "mr-2 h-5 w-5" : "mr-2 h-4 w-4")} />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Filter by date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={1}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            {setStatusFilter && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn("bg-white/10 border-white/20 text-white", isMobile && "h-11 touch-target-44")}>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Spot Type Filter */}
            {setSpotTypeFilter && (
              <Select value={spotTypeFilter} onValueChange={setSpotTypeFilter}>
                <SelectTrigger className={cn("bg-white/10 border-white/20 text-white", isMobile && "h-11 touch-target-44")}>
                  <SelectValue placeholder="Filter by spot type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Spot Types</SelectItem>
                  <SelectItem value="MC">MC</SelectItem>
                  <SelectItem value="Feature">Feature</SelectItem>
                  <SelectItem value="Headliner">Headliner</SelectItem>
                  <SelectItem value="Guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Confirmation Status Filter */}
            {setConfirmationFilter && (
              <Select value={confirmationFilter} onValueChange={setConfirmationFilter}>
                <SelectTrigger className={cn("bg-white/10 border-white/20 text-white", isMobile && "h-11 touch-target-44")}>
                  <SelectValue placeholder="Confirmation status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unassigned">Not Assigned</SelectItem>
                  <SelectItem value="assigned">Spot Assigned</SelectItem>
                  <SelectItem value="pending">Awaiting Confirmation</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className={cn("bg-white/10 border-white/20 text-white", isMobile && "h-11 touch-target-44")}>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applied_at_desc">Latest First</SelectItem>
                <SelectItem value="applied_at_asc">Oldest First</SelectItem>
                <SelectItem value="comedian_name">Comedian Name</SelectItem>
                <SelectItem value="event_date">Event Date</SelectItem>
                <SelectItem value="most_experienced">Most Experienced</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              onClick={onClearFilters}
              className={cn(
                "professional-button text-white border-white/30 hover:bg-white/10",
                isMobile && "h-11 touch-target-44"
              )}
            >
              <Filter className={cn(isMobile ? "w-5 h-5 mr-2" : "w-4 h-4 mr-2")} />
              Clear Filters
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicationFilters;
