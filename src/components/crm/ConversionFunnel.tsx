import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PipelineDatum } from '@/hooks/useAnalytics';
import { ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversionFunnelProps {
  data: PipelineDatum[];
  isLoading?: boolean;
}

const formatStageLabel = (stage: string) => stage.replace(/_/g, ' ');

export const ConversionFunnel = ({ data, isLoading = false }: ConversionFunnelProps) => {
  const sortedData = [...data].sort((a, b) => a.stage.localeCompare(b.stage));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Deal pipeline</CardTitle>
        <p className="text-sm text-muted-foreground">Count of deals by stage and total value.</p>
      </CardHeader>
      <CardContent className="h-64">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <ResponsiveContainer>
            <BarChart data={sortedData} margin={{ left: 12, right: 12, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="stage"
                tickFormatter={formatStageLabel}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltipContent
                    active={active}
                    payload={payload}
                    label={formatStageLabel(label as string)}
                    formatter={(value, name) =>
                      name === 'value'
                        ? [`$${Number(value).toLocaleString()}`, 'Pipeline value']
                        : [`${value} deals`, 'Deals']
                    }
                  />
                )}
              />
              <Bar dataKey="count" name="Deals" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
