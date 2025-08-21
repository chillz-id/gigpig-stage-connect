import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface RealtimeViewersProps {
  count: number;
}

export const RealtimeViewers: React.FC<RealtimeViewersProps> = ({ count }) => {
  return (
    <Card className="border-green-500 bg-green-50 dark:bg-green-950">
      <CardContent className="flex items-center gap-2 p-3">
        <div className="relative">
          <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="text-sm">
          <span className="font-semibold text-green-700 dark:text-green-300">{count}</span>
          <span className="text-green-600 dark:text-green-400 ml-1">
            {count === 1 ? 'viewer' : 'viewers'} now
          </span>
        </div>
      </CardContent>
    </Card>
  );
};