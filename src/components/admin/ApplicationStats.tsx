import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Users, Clock, CheckCircle2, User, AlertCircle, XCircle, UserCheck } from 'lucide-react';

interface ApplicationStatsProps {
  stats: {
    mc?: number;
    feature?: number;
    headliner?: number;
    guest?: number;
    pending?: number;
    accepted?: number;
    rejected?: number;
    withdrawn?: number;
    assigned?: number;
    confirmed?: number;
    overdue?: number;
    unread?: number;
  };
}

const ApplicationStats: React.FC<ApplicationStatsProps> = ({ stats }) => {
  const statsCards = [
    // Application Status
    {
      label: 'Pending',
      value: stats.pending ?? 0,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      label: 'Accepted',
      value: stats.accepted ?? 0,
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      label: 'Rejected',
      value: stats.rejected ?? 0,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
    },
    // Spot Types
    {
      label: 'MC',
      value: stats.mc ?? 0,
      icon: Mic,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      label: 'Feature',
      value: stats.feature ?? 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Headliner',
      value: stats.headliner ?? 0,
      icon: User,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10',
    },
    // Spot Assignment
    {
      label: 'Spots Assigned',
      value: stats.assigned ?? 0,
      icon: UserCheck,
      color: 'text-teal-400',
      bgColor: 'bg-teal-400/10',
    },
    {
      label: 'Confirmed',
      value: stats.confirmed ?? 0,
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      label: 'Overdue',
      value: stats.overdue ?? 0,
      icon: AlertCircle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      highlight: stats.overdue && stats.overdue > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className={`bg-white/10 backdrop-blur-sm border-white/20 text-white ${
              stat.highlight ? 'ring-2 ring-orange-400' : ''
            }`}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className={`flex items-center justify-center mb-2 ${stat.bgColor} rounded-lg p-2`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
              </div>
              <div className={`text-lg sm:text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-purple-200">{stat.label}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ApplicationStats;