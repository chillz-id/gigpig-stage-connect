import { Pie, PieChart, Cell, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SegmentDatum } from '@/hooks/useAnalytics';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

interface SegmentChartProps {
  data: SegmentDatum[];
  isLoading?: boolean;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const chartConfig = {
  segment: {
    label: 'Customers',
  },
};

export const SegmentChart = ({ data, isLoading = false }: SegmentChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Customer segments</CardTitle>
        <p className="text-sm text-muted-foreground">Distribution of customers by segment.</p>
      </CardHeader>
      <CardContent className="h-64">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  dataKey="count"
                  nameKey="segment"
                  data={data}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={entry.segment} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => `${value} customers`} />}
                />
                <Legend verticalAlign="bottom" height={32} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
