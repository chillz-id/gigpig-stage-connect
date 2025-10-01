import { ReactNode } from 'react';
import { MapPin, Calendar, DollarSign, RefreshCw, Route, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Tour, TourStatistics } from '@/types/tour';

interface TourWorkspaceHeaderProps {
  tour: Tour;
  stopsCount: number;
  tourStatistics?: TourStatistics;
  dragEnabled: boolean;
  isEditable: boolean;
  onRefresh: () => void;
  onToggleDrag: () => void;
  onAddStop: () => void;
  rightActions?: ReactNode;
  formatCurrency: (amount: number) => string;
}

export function TourWorkspaceHeader({
  tour,
  stopsCount,
  tourStatistics,
  dragEnabled,
  isEditable,
  onRefresh,
  onToggleDrag,
  onAddStop,
  rightActions,
  formatCurrency,
}: TourWorkspaceHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Tour Planning - {tour.name}</h2>
        <div className="flex items-center gap-4 text-blue-200 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{stopsCount} stops</span>
          </div>
          {tour.start_date && tour.end_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(tour.start_date).toLocaleDateString()} - {new Date(tour.end_date).toLocaleDateString()}
              </span>
            </div>
          )}
          {tourStatistics && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{formatCurrency(tourStatistics.total_revenue)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="border-blue-400/30 text-blue-200 hover:bg-blue-500/20"
          onClick={onRefresh}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>

        {isEditable && (
          <>
            <Button
              variant="outline"
              className="border-purple-400/30 text-purple-200 hover:bg-purple-500/20"
              onClick={onToggleDrag}
            >
              <Route className="w-4 h-4 mr-2" />
              {dragEnabled ? 'Lock Order' : 'Reorder Stops'}
            </Button>
            <Button
              onClick={onAddStop}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Stop
            </Button>
          </>
        )}

        {rightActions}
      </div>
    </div>
  );
}

