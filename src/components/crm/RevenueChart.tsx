import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { RevenueDatum } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

interface RevenueChartProps {
  data: RevenueDatum[];
  isLoading?: boolean;
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    theme: {
      light: 'hsl(var(--chart-1))',
      dark: 'hsl(var(--chart-1))',
    },
  },
};

export const RevenueChart = ({ data, isLoading = false }: RevenueChartProps) => {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Revenue trend</CardTitle>
        <p className="text-sm text-muted-foreground">
          Six-month invoiced revenue across paid and completed invoices.
        </p>
      </CardHeader>
      <CardContent className="h-64">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full">
            <AreaChart data={data} margin={{ left: 8, right: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} dy={10} />
              <YAxis
                tickLine={false}
                axisLine={false}
                dx={-10}
                tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={<ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString()}`} />}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--chart-1))"
                fill="url(#revenueGradient)"
                strokeWidth={2}
                name="Revenue"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
