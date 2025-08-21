import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend,
  Tooltip
} from 'recharts';
import { Badge } from '@/components/ui/badge';

interface PlatformData {
  platform: string;
  revenue: number;
  tickets: number;
  percentage: number;
}

interface PlatformBreakdownWidgetProps {
  data: PlatformData[];
}

const PlatformBreakdownWidget: React.FC<PlatformBreakdownWidgetProps> = ({ data }) => {
  // Define colors for each platform
  const platformColors: Record<string, string> = {
    humanitix: '#10B981',
    eventbrite: '#F97316',
    manual: '#8B5CF6',
    Unknown: '#6B7280'
  };

  const chartData = data.map(item => ({
    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
    value: item.revenue,
    tickets: item.tickets,
    percentage: item.percentage
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Revenue: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            Tickets: {data.tickets}
          </p>
          <p className="text-sm text-muted-foreground">
            Share: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(0)}%`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Platform Breakdown</span>
          <Badge variant="secondary" className="font-normal">
            {data.length} {data.length === 1 ? 'Platform' : 'Platforms'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          {chartData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={platformColors[entry.name.toLowerCase()] || '#6B7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-muted-foreground">No platform data available</p>
            </div>
          )}

          {/* Platform List */}
          <div className="space-y-2 pt-4 border-t">
            {data.map((platform, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: platformColors[platform.platform.toLowerCase()] || '#6B7280' 
                    }}
                  />
                  <span className="font-medium capitalize">
                    {platform.platform}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(platform.revenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {platform.tickets} tickets
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {data.length > 1 && (
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total across all platforms
                </span>
                <span className="font-semibold">
                  {formatCurrency(data.reduce((sum, p) => sum + p.revenue, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformBreakdownWidget;