import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Download, MapPin } from 'lucide-react';
import { SuburbData } from '@/hooks/useAdminAnalytics';

interface TicketsBySuburbChartProps {
  data: SuburbData[];
  onExport: () => void;
}

const COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'
];

export const TicketsBySuburbChart: React.FC<TicketsBySuburbChartProps> = ({ 
  data, 
  onExport 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-AU').format(value);
  };

  // Prepare data for pie chart (top 8 suburbs + others)
  const topSuburbs = data.slice(0, 8);
  const otherSuburbs = data.slice(8);
  
  const chartData = [...topSuburbs];
  if (otherSuburbs.length > 0) {
    const othersData = {
      suburb: 'Others',
      ticketsSold: otherSuburbs.reduce((sum, s) => sum + s.ticketsSold, 0),
      revenue: otherSuburbs.reduce((sum, s) => sum + s.revenue, 0),
      percentage: otherSuburbs.reduce((sum, s) => sum + s.percentage, 0)
    };
    chartData.push(othersData);
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/90 border border-white/20 rounded-lg p-3 text-white">
          <p className="font-medium">{data.suburb}</p>
          <p className="text-sm text-gray-300">
            Tickets: {formatNumber(data.ticketsSold)}
          </p>
          <p className="text-sm text-gray-300">
            Revenue: {formatCurrency(data.revenue)}
          </p>
          <p className="text-sm text-gray-300">
            Share: {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Tickets by Suburb
        </CardTitle>
        <Button
          className="professional-button text-white border-white/20 hover:bg-white/10"
          size="sm"
          onClick={onExport}
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={40}
                  dataKey="ticketsSold"
                  nameKey="suburb"
                  label={({ percentage }) => `${percentage.toFixed(1)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Suburbs List */}
          <div className="space-y-3">
            <h4 className="text-white font-medium mb-4">Top Performing Suburbs</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {data.slice(0, 10).map((suburb, index) => (
                <div 
                  key={suburb.suburb} 
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">
                        #{index + 1}
                      </span>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                    </div>
                    <div>
                      <div className="text-white font-medium">{suburb.suburb}</div>
                      <div className="text-xs text-gray-300">
                        {formatNumber(suburb.ticketsSold)} tickets
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium text-sm">
                      {formatCurrency(suburb.revenue)}
                    </div>
                    <div className="text-xs text-gray-300">
                      {suburb.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              {data.length}
            </div>
            <div className="text-sm text-gray-300">Total Suburbs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">
              {data[0]?.suburb || 'N/A'}
            </div>
            <div className="text-sm text-gray-300">Top Suburb</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {formatNumber(data.reduce((sum, s) => sum + s.ticketsSold, 0))}
            </div>
            <div className="text-sm text-gray-300">Total Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {data.length > 0 ? (data.reduce((sum, s) => sum + s.ticketsSold, 0) / data.length).toFixed(0) : '0'}
            </div>
            <div className="text-sm text-gray-300">Avg per Suburb</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};