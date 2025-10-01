import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/hooks/use-toast';
import { tourService } from '@/services/tourService';
import type {
  CreateTourStopRequest,
  Tour,
  TourLogistics,
  TourStop,
  TourStopStatus,
  TourStatistics,
} from '@/types/tour';

interface UseTourWorkspaceOptions {
  tour: Tour;
  isEditable: boolean;
}

export function useTourWorkspace({ tour, isEditable }: UseTourWorkspaceOptions) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'logistics' | 'map'>('overview');
  const [dragEnabled, setDragEnabled] = useState(false);
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [showStopDetailsModal, setShowStopDetailsModal] = useState(false);
  const [selectedStop, setSelectedStop] = useState<TourStop | null>(null);

  const {
    data: tourStops = [],
    isLoading: stopsLoading,
    refetch: refetchStops,
  } = useQuery({
    queryKey: ['tour-stops', tour.id],
    queryFn: () => tourService.getTourStops(tour.id),
    refetchInterval: 30_000,
  });

  const { data: tourLogistics = [] } = useQuery({
    queryKey: ['tour-logistics', tour.id],
    queryFn: () => tourService.getTourLogistics(tour.id),
    refetchInterval: 30_000,
  });

  const { data: tourStatistics } = useQuery({
    queryKey: ['tour-statistics', tour.id],
    queryFn: () => tourService.getTourStatistics(tour.id),
    refetchInterval: 60_000,
  });

  const createStopMutation = useMutation({
    mutationFn: tourService.createTourStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      queryClient.invalidateQueries({ queryKey: ['tour-statistics', tour.id] });
      toast({
        title: 'Tour Stop Added',
        description: 'New tour stop has been added successfully.',
      });
      setShowAddStopModal(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add tour stop. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateStopMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTourStopRequest> }) =>
      tourService.updateTourStop(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      toast({
        title: 'Tour Stop Updated',
        description: 'Tour stop has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update tour stop.',
        variant: 'destructive',
      });
    },
  });

  const deleteStopMutation = useMutation({
    mutationFn: tourService.deleteTourStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      queryClient.invalidateQueries({ queryKey: ['tour-statistics', tour.id] });
      toast({
        title: 'Tour Stop Deleted',
        description: 'Tour stop has been removed from the tour.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete tour stop.',
        variant: 'destructive',
      });
    },
  });

  const bulkUpdateStopsMutation = useMutation({
    mutationFn: tourService.bulkUpdateTourStops,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      toast({
        title: 'Tour Order Updated',
        description: 'Tour stop order has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update tour order.',
        variant: 'destructive',
      });
    },
  });

  const sortedStops = useMemo(
    () => [...tourStops].sort((a, b) => a.order_index - b.order_index),
    [tourStops],
  );

  useEffect(() => {
    if (!isEditable || sortedStops.length < 2) return;

    const updates: Array<{ id: string; data: Partial<TourStop> }> = [];

    sortedStops.forEach((stop, index) => {
      if (index >= sortedStops.length - 1) return;
      const nextStop = sortedStops[index + 1];
      const distance = stop.distance_to_next_km || 500;
      const averageSpeed = 80;
      const travelTimeMinutes = Math.round((distance / averageSpeed) * 60);

      if (stop.travel_time_to_next !== travelTimeMinutes) {
        updates.push({
          id: stop.id,
          data: { travel_time_to_next: travelTimeMinutes },
        });
      }
    });

    if (updates.length > 0) {
      bulkUpdateStopsMutation.mutate(updates);
    }
  }, [sortedStops, bulkUpdateStopsMutation, isEditable]);

  const handleDragEnd = useCallback(
    (result: any) => {
      if (!result?.destination || !isEditable) return;

      const items = Array.from(sortedStops);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      const updates = items.map((stop, index) => ({
        id: stop.id,
        data: { order_index: index + 1 },
      }));

      bulkUpdateStopsMutation.mutate(updates);
    },
    [sortedStops, isEditable, bulkUpdateStopsMutation],
  );

  const handleDeleteStop = useCallback(
    (stopId: string) => {
      if (window.confirm('Are you sure you want to delete this tour stop? This action cannot be undone.')) {
        deleteStopMutation.mutate(stopId);
      }
    },
    [deleteStopMutation],
  );

  const getStatusColor = useCallback((status: TourStopStatus): string => {
    const colors: Record<TourStopStatus, string> = {
      planned: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      postponed: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return colors[status] || colors.planned;
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const openAddStopModal = useCallback(() => setShowAddStopModal(true), []);
  const closeAddStopModal = useCallback(() => setShowAddStopModal(false), []);

  const openStopDetails = useCallback((stop: TourStop) => {
    setSelectedStop(stop);
    setShowStopDetailsModal(true);
  }, []);

  const closeStopDetails = useCallback(() => {
    setShowStopDetailsModal(false);
    setSelectedStop(null);
  }, []);

  const toggleDragEnabled = useCallback(() => setDragEnabled(prev => !prev), []);

  return {
    activeTab,
    setActiveTab,
    dragEnabled,
    toggleDragEnabled,
    showAddStopModal,
    openAddStopModal,
    closeAddStopModal,
    showStopDetailsModal,
    openStopDetails,
    closeStopDetails,
    selectedStop,
    sortedStops,
    stopsLoading,
    tourLogistics: tourLogistics as TourLogistics[],
    tourStatistics: tourStatistics as TourStatistics | undefined,
    handleDragEnd,
    handleDeleteStop,
    refetchStops,
    getStatusColor,
    formatCurrency,
    createStop: createStopMutation.mutate,
    createStopLoading: createStopMutation.isPending,
    updateStop: (data: Partial<CreateTourStopRequest>) => {
      if (selectedStop) {
        updateStopMutation.mutate({ id: selectedStop.id, data });
      }
    },
    updateStopLoading: updateStopMutation.isPending,
    deleteStopLoading: deleteStopMutation.isPending,
    nextOrderIndex: tourStops.length + 1,
  };
}

