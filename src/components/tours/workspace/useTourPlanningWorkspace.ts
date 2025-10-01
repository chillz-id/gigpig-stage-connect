import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/hooks/use-toast';
import { tourService } from '@/services/tourService';
import type {
  Tour,
  TourStop,
  CreateTourStopRequest,
  TourLogistics,
  TourStatistics
} from '@/types/tour';

type DragResult = {
  source: { index: number; droppableId: string };
  destination: { index: number; droppableId: string } | null;
};

export function useTourPlanningWorkspace(tour: Tour, isEditable: boolean) {
  const queryClient = useQueryClient();

  const [dragEnabled, setDragEnabled] = useState(false);
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [selectedStop, setSelectedStop] = useState<TourStop | null>(null);
  const [showStopDetailsModal, setShowStopDetailsModal] = useState(false);

  const {
    data: tourStops = [],
    isLoading: stopsLoading,
    refetch: refetchStops
  } = useQuery({
    queryKey: ['tour-stops', tour.id],
    queryFn: () => tourService.getTourStops(tour.id),
    refetchInterval: 30000
  });

  const { data: tourLogistics = [] } = useQuery({
    queryKey: ['tour-logistics', tour.id],
    queryFn: () => tourService.getTourLogistics(tour.id),
    refetchInterval: 30000
  });

  const { data: tourStatistics } = useQuery({
    queryKey: ['tour-statistics', tour.id],
    queryFn: () => tourService.getTourStatistics(tour.id),
    refetchInterval: 60000
  });

  const createStopMutation = useMutation({
    mutationFn: tourService.createTourStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      queryClient.invalidateQueries({ queryKey: ['tour-statistics', tour.id] });
      toast({
        title: 'Tour Stop Added',
        description: 'New tour stop has been added successfully.'
      });
      setShowAddStopModal(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add tour stop. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const updateStopMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTourStopRequest> }) =>
      tourService.updateTourStop(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      toast({
        title: 'Tour Stop Updated',
        description: 'Tour stop has been updated successfully.'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update tour stop.',
        variant: 'destructive'
      });
    }
  });

  const deleteStopMutation = useMutation({
    mutationFn: tourService.deleteTourStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      queryClient.invalidateQueries({ queryKey: ['tour-statistics', tour.id] });
      toast({
        title: 'Tour Stop Deleted',
        description: 'Tour stop has been removed from the tour.'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete tour stop.',
        variant: 'destructive'
      });
    }
  });

  const bulkUpdateStopsMutation = useMutation({
    mutationFn: tourService.bulkUpdateTourStops,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      toast({
        title: 'Tour Order Updated',
        description: 'Tour stop order has been updated successfully.'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update tour order.',
        variant: 'destructive'
      });
    }
  });

  const formatCurrency = (amount: number, currency: string = 'AUD'): string =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  const calculateTravelTime = (fromStop: TourStop): number => {
    const distance = fromStop.distance_to_next_km || 500;
    const avgSpeed = 80;
    return Math.round((distance / avgSpeed) * 60);
  };

  const handleDragEnd = (result: DragResult) => {
    if (!result.destination || !isEditable) return;

    const items = Array.from(tourStops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    if (!reorderedItem) return;

    const destinationIndex = Math.min(result.destination.index, items.length);
    items.splice(destinationIndex, 0, reorderedItem);

    const updates = items.map((stop, index) => ({
      id: stop.id,
      data: { order_index: index + 1 }
    }));

    bulkUpdateStopsMutation.mutate(updates);
  };

  const handleDeleteStop = (stopId: string) => {
    if (window.confirm('Are you sure you want to delete this tour stop? This action cannot be undone.')) {
      deleteStopMutation.mutate(stopId);
    }
  };

  useEffect(() => {
    if (!isEditable || tourStops.length <= 1) return;

    const updates: Array<{ id: string; data: Partial<TourStop> }> = [];

    tourStops.forEach((stop, index) => {
      if (index < tourStops.length - 1) {
        const nextStop = tourStops[index + 1];
        if (!nextStop) {
          return;
        }

        const travelTime = calculateTravelTime(stop);

        if (stop.travel_time_to_next !== travelTime) {
          updates.push({
            id: stop.id,
            data: { travel_time_to_next: travelTime }
          });
        }
      }
    });

    if (updates.length > 0) {
      bulkUpdateStopsMutation.mutate(updates);
    }
  }, [tourStops, isEditable, bulkUpdateStopsMutation]);

  const sortedStops = useMemo(
    () => [...tourStops].sort((a, b) => a.order_index - b.order_index),
    [tourStops]
  );

  const openStopDetails = (stop: TourStop) => {
    setSelectedStop(stop);
    setShowStopDetailsModal(true);
  };

  const closeStopDetails = () => {
    setSelectedStop(null);
    setShowStopDetailsModal(false);
  };

  const toggleDrag = () => setDragEnabled((prev) => !prev);

  return {
    dragEnabled,
    toggleDrag,
    showAddStopModal,
    setShowAddStopModal,
    selectedStop,
    showStopDetailsModal,
    openStopDetails,
    closeStopDetails,
    tourStops,
    sortedStops,
    tourLogistics: tourLogistics as TourLogistics[],
    tourStatistics: tourStatistics as TourStatistics | undefined,
    stopsLoading,
    refetchStops,
    formatCurrency,
    createStopMutation,
    updateStopMutation,
    deleteStopMutation,
    bulkUpdateStopsMutation,
    handleDragEnd,
    handleDeleteStop
  };
}
