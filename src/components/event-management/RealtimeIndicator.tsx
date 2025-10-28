/**
 * RealtimeIndicator Component
 *
 * Visual indicator showing real-time connection status.
 * Displays a pulse animation when connected to Supabase real-time.
 */

import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  connections?: {
    applications: boolean;
    spots: boolean;
    deals: boolean;
    event: boolean;
  };
}

export function RealtimeIndicator({ isConnected, connections }: RealtimeIndicatorProps) {
  // If no detailed connections provided, show simple indicator
  if (!connections) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-gray-400" />
                  <div className="h-2 w-2 rounded-full bg-gray-400" />
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isConnected ? 'Real-time updates active' : 'Real-time disconnected'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show detailed connection status
  const activeCount = Object.values(connections).filter(Boolean).length;
  const totalCount = Object.keys(connections).length;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
                <span className="text-xs font-medium text-green-600">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-gray-400" />
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-xs font-medium text-gray-600">
                  {activeCount}/{totalCount}
                </span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-48">
          <div className="space-y-1 text-xs">
            <p className="font-semibold">Real-time Connections:</p>
            <div className="space-y-0.5">
              <StatusRow label="Applications" connected={connections.applications} />
              <StatusRow label="Lineup" connected={connections.spots} />
              <StatusRow label="Deals" connected={connections.deals} />
              <StatusRow label="Event" connected={connections.event} />
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function StatusRow({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={cn(
          'font-medium',
          connected ? 'text-green-600' : 'text-gray-400'
        )}
      >
        {connected ? '●' : '○'}
      </span>
    </div>
  );
}
