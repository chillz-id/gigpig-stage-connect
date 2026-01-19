import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { TicketProviderData } from '@/hooks/useAdminAnalytics';

interface TicketsByProviderChartProps {
  data: TicketProviderData[];
  onExport: () => void;
}

export const TicketsByProviderChart: React.FC<TicketsByProviderChartProps> = ({ 
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

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Tickets by Provider
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
        <div className="space-y-6">
          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="provider" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
                tickFormatter={formatNumber}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.9)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: number, name: string) => [
                  name === 'ticketsSold' ? formatNumber(value) : formatCurrency(value),
                  name === 'ticketsSold' ? 'Tickets Sold' : 'Revenue'
                ]}
              />
              <Bar 
                dataKey="ticketsSold" 
                fill="#8b5cf6" 
                name="Tickets Sold"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Summary Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-white font-medium py-3">Provider</th>
                  <th className="text-right text-white font-medium py-3">Tickets</th>
                  <th className="text-right text-white font-medium py-3">Revenue</th>
                  <th className="text-right text-white font-medium py-3">Market Share</th>
                  <th className="text-right text-white font-medium py-3">Growth</th>
                </tr>
              </thead>
              <tbody>
                {data.map((provider, index) => (
                  <tr 
                    key={provider.provider} 
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 text-white font-medium">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: index === 0 ? '#8b5cf6' : 
                                           index === 1 ? '#06b6d4' : 
                                           index === 2 ? '#10b981' : '#f59e0b'
                          }}
                        />
                        {provider.provider}
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-300">
                      {formatNumber(provider.ticketsSold)}
                    </td>
                    <td className="py-3 text-right text-gray-300">
                      {formatCurrency(provider.revenue)}
                    </td>
                    <td className="py-3 text-right text-gray-300">
                      {provider.percentage.toFixed(1)}%
                    </td>
                    <td className="py-3 text-right">
                      <div className={`flex items-center justify-end gap-1 ${
                        provider.growth >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {provider.growth >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{Math.abs(provider.growth).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {data[0]?.provider || 'N/A'}
              </div>
              <div className="text-sm text-gray-300">Top Provider</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {data.filter(p => p.growth > 0).length}/{data.length}
              </div>
              <div className="text-sm text-gray-300">Growing Providers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">
                {formatCurrency(data.reduce((sum, p) => sum + p.revenue, 0))}
              </div>
              <div className="text-sm text-gray-300">Total Revenue</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};