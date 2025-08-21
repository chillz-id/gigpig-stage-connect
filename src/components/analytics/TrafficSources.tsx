import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Globe, Link, Search, Share2, Mail } from 'lucide-react';
import type { ProfileAnalyticsDaily } from '@/types/analytics';

interface TrafficSourcesProps {
  topSources: Array<{ source: string; percentage: number }>;
  analyticsData: ProfileAnalyticsDaily[];
}

export const TrafficSources: React.FC<TrafficSourcesProps> = ({ 
  topSources, 
  analyticsData 
}) => {
  const getSourceIcon = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('google') || lowerSource.includes('search')) return Search;
    if (lowerSource.includes('facebook') || lowerSource.includes('instagram') || lowerSource.includes('social')) return Share2;
    if (lowerSource.includes('email') || lowerSource.includes('mail')) return Mail;
    if (lowerSource === 'direct') return Link;
    return Globe;
  };

  const getSourceColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
    ];
    return colors[index % colors.length];
  };

  // Aggregate country data
  const countryMap = new Map<string, number>();
  analyticsData.forEach(day => {
    day.top_countries.forEach(country => {
      const current = countryMap.get(country.country) || 0;
      countryMap.set(country.country, current + country.count);
    });
  });

  const topCountries = Array.from(countryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, count]) => ({
      country,
      count,
      percentage: (count / Array.from(countryMap.values()).reduce((a, b) => a + b, 0)) * 100,
    }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Top Traffic Sources</CardTitle>
          <CardDescription>Where your visitors come from</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {topSources.length > 0 ? (
            topSources.map((source, index) => {
              const Icon = getSourceIcon(source.source);
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{source.source}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {source.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={source.percentage} 
                    className="h-2"
                  />
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No traffic data available yet
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Countries</CardTitle>
          <CardDescription>Geographic distribution of visitors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {topCountries.length > 0 ? (
            topCountries.map((country, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{country.country}</span>
                  <span className="text-sm text-muted-foreground">
                    {country.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={country.percentage} 
                  className="h-2"
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No geographic data available yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};