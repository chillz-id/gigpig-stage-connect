import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SalesData {
  date: string;
  revenue: number;
  tickets: number;
}

interface SalesVelocityChartProps {
  data: SalesData[];
  timeRange: string;
}

const SalesVelocityChart: React.FC<SalesVelocityChartProps> = ({ data, timeRange }) => {
  // Calculate trend
  const calculateTrend = () => {
    if (data.length < 2) return { percentage: 0, direction: 'neutral' };
    
    const midPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midPoint);
    const secondHalf = data.slice(midPoint);
    
    const firstHalfRevenue = firstHalf.reduce((sum, d) => sum + d.revenue, 0);
    const secondHalfRevenue = secondHalf.reduce((sum, d) => sum + d.revenue, 0);
    
    if (firstHalfRevenue === 0) return { percentage: 100, direction: 'up' };
    
    const percentageChange = ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100;
    
    return {
      percentage: Math.abs(percentageChange),
      direction: percentageChange > 5 ? 'up' : percentageChange < -5 ? 'down' : 'neutral'
    };
  };

  const trend = calculateTrend();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatXAxis = (tickItem: string) => {
    const date = parseISO(tickItem);
    if (timeRange === '24h') {
      return format(date, 'HH:mm');
    } else if (timeRange === '7d') {
      return format(date, 'EEE');
    } else if (timeRange === '30d') {
      return format(date, 'MMM d');
    } else {
      return format(date, 'MMM d');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const date = parseISO(label);
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">
            {format(date, 'PPP')}
          </p>
          <p className="text-sm text-muted-foreground">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-muted-foreground">
            Tickets: {payload[1]?.value || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sales Trend</CardTitle>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {trend.percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                yAxisId="revenue"
                orientation="left"
                tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                yAxisId="tickets"
                orientation="right"
                stroke="#9CA3AF"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Revenue Area */}
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#8B5CF6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              
              {/* Tickets Bar */}
              <Bar
                yAxisId="tickets"
                dataKey="tickets"
                fill="#10B981"
                opacity={0.6}
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">Tickets</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesVelocityChart;