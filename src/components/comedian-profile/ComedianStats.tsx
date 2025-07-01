
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, Star, Users } from 'lucide-react';

interface ComedianStatsProps {
  comedianId: string;
}

interface Stats {
  total_shows: number;
  confirmed_shows: number;
  total_vouches: number;
  average_rating: number;
}

const ComedianStats: React.FC<ComedianStatsProps> = ({ comedianId }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['comedian-stats', comedianId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_comedian_stats', {
        comedian_id_param: comedianId
      });
      
      if (error) throw error;
      return data[0] as Stats;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="h-8 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      icon: Calendar,
      label: 'Total Shows',
      value: stats.total_shows,
      color: 'text-blue-600'
    },
    {
      icon: Trophy,
      label: 'Confirmed Shows',
      value: stats.confirmed_shows,
      color: 'text-green-600'
    },
    {
      icon: Users,
      label: 'Vouches',
      value: stats.total_vouches,
      color: 'text-purple-600'
    },
    {
      icon: Star,
      label: 'Average Rating',
      value: stats.average_rating ? `${Number(stats.average_rating).toFixed(1)}/5` : 'N/A',
      color: 'text-yellow-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-2 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianStats;
