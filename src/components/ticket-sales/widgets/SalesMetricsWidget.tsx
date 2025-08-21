import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity,
  Percent
} from 'lucide-react';

interface SalesMetricsWidgetProps {
  metrics: {
    totalRevenue: number;
    totalTicketsSold: number;
    averageTicketPrice: number;
    salesVelocity: number;
    conversionRate: number;
  };
}

const SalesMetricsWidget: React.FC<SalesMetricsWidgetProps> = ({ metrics }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: amount < 100 ? 2 : 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const metricsData = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      description: 'Gross ticket sales'
    },
    {
      title: 'Tickets Sold',
      value: formatNumber(metrics.totalTicketsSold),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      description: 'Total tickets purchased'
    },
    {
      title: 'Average Price',
      value: formatCurrency(metrics.averageTicketPrice),
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      description: 'Per ticket average'
    },
    {
      title: 'Sales Velocity',
      value: `${metrics.salesVelocity.toFixed(1)}/day`,
      icon: Activity,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      description: '7-day average'
    },
    {
      title: 'Conversion Rate',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: Percent,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      description: 'Of total capacity',
      hideIfZero: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {metricsData.map((metric, index) => {
        // Skip conversion rate if it's zero (multi-event mode or no capacity)
        if (metric.hideIfZero && metrics.conversionRate === 0) {
          return null;
        }

        return (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
                <div className={`${metric.bgColor} p-3 rounded-lg`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
              
              {/* Decorative gradient */}
              <div 
                className={`absolute -bottom-1 -right-1 w-20 h-20 ${metric.bgColor} opacity-20 rounded-full blur-2xl`}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SalesMetricsWidget;