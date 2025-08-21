import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import type { ProfileAnalyticsDaily } from '@/types/analytics';

interface DeviceBreakdownProps {
  analyticsData: ProfileAnalyticsDaily[];
}

export const DeviceBreakdown: React.FC<DeviceBreakdownProps> = ({ analyticsData }) => {
  // Aggregate device data
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();

  analyticsData.forEach(day => {
    Object.entries(day.device_breakdown).forEach(([device, count]) => {
      const current = deviceMap.get(device) || 0;
      deviceMap.set(device, current + count);
    });

    Object.entries(day.browser_breakdown).forEach(([browser, count]) => {
      const current = browserMap.get(browser) || 0;
      browserMap.set(browser, current + count);
    });
  });

  const deviceData = Array.from(deviceMap.entries()).map(([device, count]) => ({
    name: device,
    value: count,
  }));

  const browserData = Array.from(browserMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([browser, count]) => ({
      name: browser,
      value: count,
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  const totalDevices = deviceData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Device Types</CardTitle>
          <CardDescription>Breakdown by device category</CardDescription>
        </CardHeader>
        <CardContent>
          {deviceData.length > 0 ? (
            <>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {deviceData.map((device, index) => {
                  const Icon = getDeviceIcon(device.name);
                  const percentage = ((device.value / totalDevices) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{device.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {device.value.toLocaleString()} ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No device data available yet
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Browsers</CardTitle>
          <CardDescription>Most used browsers by visitors</CardDescription>
        </CardHeader>
        <CardContent>
          {browserData.length > 0 ? (
            <div className="space-y-4">
              {browserData.map((browser, index) => {
                const percentage = ((browser.value / browserData.reduce((sum, b) => sum + b.value, 0)) * 100).toFixed(1);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{browser.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {browser.value.toLocaleString()} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No browser data available yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};