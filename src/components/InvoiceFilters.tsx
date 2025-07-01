
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateFilter, AmountRange } from '@/types/invoice';

interface InvoiceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: DateFilter;
  setDateFilter: (date: DateFilter) => void;
  amountRange: AmountRange;
  setAmountRange: (range: AmountRange) => void;
  onClearFilters: () => void;
}

const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  amountRange,
  setAmountRange,
  onClearFilters
}) => {
  const handleAmountRangeChange = (values: number[]) => {
    setAmountRange({ min: values[0], max: values[1] });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search - Full width on mobile */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search invoices, recipients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>
          
          {/* Filters Grid - Responsive layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-quarter">This Quarter</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              className="flex items-center justify-center gap-2 h-12 text-base"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Filters</span>
            </Button>
          </div>

          {/* Amount Range Slider */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Amount Range</span>
            </div>
            
            <div className="px-3">
              <Slider
                value={[amountRange.min, amountRange.max]}
                onValueChange={handleAmountRangeChange}
                max={10000}
                min={0}
                step={50}
                className="w-full"
              />
            </div>
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{formatCurrency(amountRange.min)}</span>
              <span className="text-xs">
                {formatCurrency(amountRange.min)} - {formatCurrency(amountRange.max)}
              </span>
              <span>{formatCurrency(amountRange.max)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceFilters;
