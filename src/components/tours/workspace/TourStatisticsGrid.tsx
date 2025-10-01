import { BarChart3, DollarSign, TrendingUp, Users } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import type { TourStatistics } from '@/types/tour';

interface TourStatisticsGridProps {
  statistics: TourStatistics;
  formatCurrency: (value: number) => string;
}

export function TourStatisticsGrid({ statistics, formatCurrency }: TourStatisticsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Capacity"
        value={statistics.total_capacity.toLocaleString()}
        icon={<Users className="w-8 h-8 text-blue-300" />}
        accent="from-blue-600/20 to-blue-700/20 border-blue-500/30"
        helper={statistics.active_stops ? `${statistics.active_stops} active stops` : undefined}
      />
      <StatCard
        label="Tickets Sold"
        value={statistics.tickets_sold.toLocaleString()}
        icon={<TrendingUp className="w-8 h-8 text-green-300" />}
        accent="from-green-600/20 to-green-700/20 border-green-500/30"
        helper={`${statistics.occupancy_rate.toFixed(1)}% occupancy`}
      />
      <StatCard
        label="Net Profit"
        value={formatCurrency(statistics.net_profit)}
        icon={<BarChart3 className="w-8 h-8 text-purple-300" />}
        accent="from-purple-600/20 to-purple-700/20 border-purple-500/30"
        helper={`${statistics.profit_margin.toFixed(1)}% margin`}
      />
      <StatCard
        label="Total Revenue"
        value={formatCurrency(statistics.total_revenue)}
        icon={<DollarSign className="w-8 h-8 text-orange-300" />}
        accent="from-orange-600/20 to-orange-700/20 border-orange-500/30"
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
  helper?: string;
}

function StatCard({ label, value, icon, accent, helper }: StatCardProps) {
  return (
    <Card className={`bg-gradient-to-br ${accent}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {helper && <p className="text-xs text-blue-300">{helper}</p>}
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
