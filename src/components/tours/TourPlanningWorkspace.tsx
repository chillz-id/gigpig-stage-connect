// Tour Planning Workspace - composed from reusable workspace modules
import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

import type {
  Tour,
  TourStopStatus,
  CreateTourStopRequest
} from '@/types/tour';

import { TourWorkspaceHeader } from './workspace/TourWorkspaceHeader';
import { TourStatisticsGrid } from './workspace/TourStatisticsGrid';
import { TourStopsBoard } from './workspace/TourStopsBoard';
import { TourTimelineView } from './workspace/TourTimelineView';
import { TourLogisticsView } from './workspace/TourLogisticsView';
import { TourMapView } from './workspace/TourMapView';
import { AddTourStopModal } from './workspace/AddTourStopModal';
import { TourStopDetailsModal } from './workspace/TourStopDetailsModal';
import { useTourPlanningWorkspace } from './workspace/useTourPlanningWorkspace';

interface TourPlanningWorkspaceProps {
  tour: Tour;
  isEditable: boolean;
}

const statusColors: Record<TourStopStatus, string> = {
  planned: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  postponed: 'bg-orange-100 text-orange-800 border-orange-300'
};

export default function TourPlanningWorkspace({ tour, isEditable }: TourPlanningWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'logistics' | 'map'>('overview');

  const {
    dragEnabled,
    toggleDrag,
    showAddStopModal,
    setShowAddStopModal,
    selectedStop,
    showStopDetailsModal,
    openStopDetails,
    closeStopDetails,
    sortedStops,
    tourLogistics,
    tourStatistics,
    stopsLoading,
    refetchStops,
    formatCurrency,
    createStopMutation,
    updateStopMutation,
    handleDragEnd,
    handleDeleteStop
  } = useTourPlanningWorkspace(tour, isEditable);

  const getStatusColor = (status: TourStopStatus) => statusColors[status] || statusColors.planned;

  const getStatusIcon = (status: TourStopStatus) => {
    const icons: Record<TourStopStatus, JSX.Element> = {
      planned: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <AlertCircle className="w-4 h-4" />,
      postponed: <AlertCircle className="w-4 h-4" />
    };

    return icons[status] || icons.planned;
  };

  return (
    <div className="space-y-6">
      <TourWorkspaceHeader
        tour={tour}
        stopsCount={sortedStops.length}
        tourStatistics={tourStatistics}
        dragEnabled={dragEnabled}
        isEditable={isEditable}
        onRefresh={refetchStops}
        onToggleDrag={toggleDrag}
        onAddStop={() => setShowAddStopModal(true)}
        formatCurrency={(value) => formatCurrency(value)}
      />

      {tourStatistics && (
        <TourStatisticsGrid statistics={tourStatistics} formatCurrency={formatCurrency} />
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="bg-slate-800/50 border-slate-700/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
            Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-slate-700">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="logistics" className="data-[state=active]:bg-slate-700">
            Logistics
          </TabsTrigger>
          <TabsTrigger value="map" className="data-[state=active]:bg-slate-700">
            Route Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <TourStopsBoard
            stops={sortedStops}
            dragEnabled={dragEnabled}
            isEditable={isEditable}
            isLoading={stopsLoading}
            onDragEnd={handleDragEnd}
            onSelectStop={openStopDetails}
            onDeleteStop={handleDeleteStop}
            onAddStop={() => setShowAddStopModal(true)}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <TourTimelineView tour={tour} stops={sortedStops} />
        </TabsContent>

        <TabsContent value="logistics" className="space-y-6">
          <TourLogisticsView tour={tour} stops={sortedStops} logistics={tourLogistics} />
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <TourMapView tour={tour} stops={sortedStops} />
        </TabsContent>
      </Tabs>

      <AddTourStopModal
        isOpen={showAddStopModal}
        onClose={() => setShowAddStopModal(false)}
        tourId={tour.id}
        nextOrderIndex={sortedStops.length + 1}
        onSubmit={createStopMutation.mutate}
        isLoading={createStopMutation.isPending}
      />

      <TourStopDetailsModal
        isOpen={showStopDetailsModal}
        onClose={closeStopDetails}
        stop={selectedStop}
        isEditable={isEditable}
        onUpdate={(data: Partial<CreateTourStopRequest>) => {
          if (selectedStop) {
            updateStopMutation.mutate({ id: selectedStop.id, data });
          }
        }}
        isLoading={updateStopMutation.isPending}
      />
    </div>
  );
}
