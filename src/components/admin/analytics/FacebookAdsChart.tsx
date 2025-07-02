import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Facebook, TrendingUp, Eye, MousePointer, ShoppingCart, DollarSign } from 'lucide-react';
import { FacebookAdsData } from '@/hooks/useAdminAnalytics';

interface FacebookAdsChartProps {
  data: FacebookAdsData | null;
}

export const FacebookAdsChart: React.FC<FacebookAdsChartProps> = ({ data }) => {
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

  const getROASColor = (roas: number) => {
    if (roas >= 4) return 'bg-green-500';
    if (roas >= 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getROASLabel = (roas: number) => {
    if (roas >= 4) return 'Excellent';
    if (roas >= 2) return 'Good';
    return 'Needs Improvement';
  };

  if (!data) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Facebook className="w-5 h-5" />
            Facebook Ads Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Facebook className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-semibold text-white mb-2">No Facebook Ads Data</h4>
            <p className="text-gray-400">
              Connect your Facebook Ads account to see performance metrics and ROAS data.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      icon: Eye,
      label: 'Impressions',
      value: formatNumber(data.impressions),
      color: 'text-blue-400'
    },
    {
      icon: MousePointer,
      label: 'Clicks',
      value: formatNumber(data.clicks),
      color: 'text-green-400'
    },
    {
      icon: ShoppingCart,
      label: 'Conversions',
      value: formatNumber(data.conversions),
      color: 'text-purple-400'
    },
    {
      icon: DollarSign,
      label: 'Spend',
      value: formatCurrency(data.spend),
      color: 'text-red-400'
    }
  ];

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Facebook className="w-5 h-5" />
          Facebook Ads Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* ROAS Header */}
          <div className="text-center p-6 rounded-lg bg-white/5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl font-bold text-white">
                {data.roas.toFixed(1)}x
              </span>
              <Badge className={getROASColor(data.roas)}>
                {getROASLabel(data.roas)}
              </Badge>
            </div>
            <p className="text-gray-300 text-sm">Return on Ad Spend (ROAS)</p>
            <p className="text-xs text-gray-400 mt-1">
              Revenue: {formatCurrency(data.revenue)} | Spend: {formatCurrency(data.spend)}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center p-4 rounded-lg bg-white/5">
                <metric.icon className={`w-6 h-6 mx-auto mb-2 ${metric.color}`} />
                <div className="text-lg font-bold text-white">{metric.value}</div>
                <div className="text-xs text-gray-300">{metric.label}</div>
              </div>
            ))}
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-white font-medium">Click Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-gray-300">Click-Through Rate</span>
                  <span className="text-white font-medium">{data.ctr.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-gray-300">Cost Per Click</span>
                  <span className="text-white font-medium">{formatCurrency(data.cpc)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-gray-300">Conversion Rate</span>
                  <span className="text-white font-medium">
                    {((data.conversions / data.clicks) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-medium">Revenue Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-gray-300">Cost Per Conversion</span>
                  <span className="text-white font-medium">
                    {formatCurrency(data.spend / data.conversions)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-gray-300">Revenue Per Conversion</span>
                  <span className="text-white font-medium">
                    {formatCurrency(data.revenue / data.conversions)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-white/5">
                  <span className="text-gray-300">Profit Margin</span>
                  <span className={`font-medium ${
                    data.revenue > data.spend ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(data.revenue - data.spend)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ROAS Benchmark */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h5 className="text-blue-400 font-medium">ROAS Benchmark</h5>
                <p className="text-sm text-gray-300 mt-1">
                  Your current ROAS of {data.roas.toFixed(1)}x is{' '}
                  {data.roas >= 3 
                    ? 'above industry average (3.0x) - excellent performance!' 
                    : 'below industry average (3.0x) - consider optimizing campaigns.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};