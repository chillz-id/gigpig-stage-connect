import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { ProfileAnalyticsDaily } from '@/types/analytics';

interface AnalyticsChartProps {
  data: ProfileAnalyticsDaily[];
  metric: 'views' | 'unique_visitors' | 'booking_requests' | 'avg_time_spent';
  title: string;
  description: string;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  data,
  metric,
  title,
  description,
}) => {
  const chartData = data.map(day => ({
    date: day.date,
    value: metric === 'views' ? day.total_views :
           metric === 'unique_visitors' ? day.unique_visitors :
           metric === 'booking_requests' ? day.booking_requests :
           day.avg_time_spent_seconds,
  }));

  const formatXAxis = (tickItem: string) => {
    return format(parseISO(tickItem), 'MMM d');
  };

  const formatTooltipLabel = (value: number) => {
    if (metric === 'avg_time_spent') {
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return `${minutes}m ${seconds}s`;
    }
    return value.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip 
                labelFormatter={(label) => format(parseISO(label as string), 'MMMM d, yyyy')}
                formatter={(value: number) => [formatTooltipLabel(value), title]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};