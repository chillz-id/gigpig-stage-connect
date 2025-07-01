
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Users, Clock } from 'lucide-react';

interface ApplicationStatsProps {
  stats: {
    mc: number;
    headliner: number;
    unread: number;
  };
}

const ApplicationStats: React.FC<ApplicationStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Mic className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{stats.mc}</div>
          <div className="text-sm text-purple-200">MC</div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{stats.headliner}</div>
          <div className="text-sm text-purple-200">Headliner</div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400">{stats.unread}</div>
          <div className="text-sm text-purple-200">Unread</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationStats;
