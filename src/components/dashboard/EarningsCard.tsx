import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, TrendingUp, TrendingDown, Filter, BarChart3 } from 'lucide-react';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useEarnings, formatCurrency, formatPercentage } from '@/hooks/useEarnings';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

export const EarningsCard: React.FC = () => {
  const { theme } = useTheme();
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [showDetails, setShowDetails] = useState(false);

  const { earningsData, isLoading } = useEarnings(dateRange);

  // Calculate display dates
  const now = new Date();
  const startDate = dateRange.start ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = dateRange.end ?? new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const getStatCardStyles = () => {
    return theme === 'pleasure'
      ? 'bg-white/10 backdrop-blur-sm border-white/20 text-white'
      : 'bg-gray-800/90 border-gray-600 text-gray-100';
  };

  const formatDateRange = (start: Date, end: Date) => {
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    if (sameMonth) {
      return start.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
    }
    return `${start.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}`;
  };

  const clearDateRange = () => {
    setDateRange({ start: null, end: null });
  };

  if (isLoading) {
    return (
      <Card className={cn(getStatCardStyles())}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-2 w-24"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(getStatCardStyles())}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          {dateRange.start && dateRange.end && (
            <Badge className="professional-button text-xs">
              Custom Range
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-black/90 border-white/20" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-white mb-2">Filter by Date Range</h4>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    onClear={clearDateRange}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  Current period: {formatDateRange(startDate, endDate)}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <DollarSign className="h-4 w-4 text-green-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-green-400">
            {earningsData ? formatCurrency(earningsData.totalEarnings) : '--'}
          </div>
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <BarChart3 className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/90 border-white/20 text-white">
              <DialogHeader>
                <DialogTitle>Earnings Breakdown</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Detailed earnings for {formatDateRange(startDate, endDate)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {earningsData?.earningsByEvent && earningsData.earningsByEvent.length > 0 ? (
                  <div className="space-y-2">
                    {earningsData.earningsByEvent.map((earning, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                        <div>
                          <p className="font-medium text-sm">{earning.eventTitle}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(earning.date).toLocaleDateString('en-AU')} • {earning.type}
                          </p>
                        </div>
                        <span className="font-bold text-green-400">
                          {formatCurrency(earning.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    No earnings found for this period
                  </p>
                )}
                
                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total</span>
                    <span className="text-green-400">
                      {earningsData ? formatCurrency(earningsData.totalEarnings) : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            {earningsData && (
              <span className="flex items-center gap-1">
                {earningsData.changePercentage >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                <span className={earningsData.changePercentage >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatPercentage(earningsData.changePercentage)}
                </span>
                from previous period
              </span>
            )}
          </p>
          
          <p className="text-xs text-gray-400">
            {formatDateRange(startDate, endDate)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};