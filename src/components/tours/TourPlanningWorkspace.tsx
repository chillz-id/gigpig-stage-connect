// Tour Planning Workspace - Multi-city tour planning and scheduling interface
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Plus, 
  Calendar, 
  Clock,
  Users,
  DollarSign,
  Navigation,
  Route,
  Building,
  Plane,
  Car,
  Train,
  Bus,
  Hotel,
  Utensils,
  Music,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Target,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Zap,
  Globe,
  Phone,
  Mail,
  Save,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAuth } from '@/contexts/AuthContext';
import { tourService } from '@/services/tourService';
import { cn } from '@/lib/utils';
import type { 
  Tour, 
  TourStop, 
  TourStopStatus,
  CreateTourStopRequest,
  TourLogistics,
  LogisticsType
} from '@/types/tour';

interface TourPlanningWorkspaceProps {
  tour: Tour;
  isEditable: boolean;
}

const TourPlanningWorkspace: React.FC<TourPlanningWorkspaceProps> = ({ 
  tour, 
  isEditable 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [selectedStop, setSelectedStop] = useState<TourStop | null>(null);
  const [showStopDetailsModal, setShowStopDetailsModal] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);

  // Queries
  const { data: tourStops = [], isLoading: stopsLoading, refetch: refetchStops } = useQuery({
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

  // Mutations
  const createStopMutation = useMutation({
    mutationFn: tourService.createTourStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      queryClient.invalidateQueries({ queryKey: ['tour-statistics', tour.id] });
      toast({
        title: "Tour Stop Added",
        description: "New tour stop has been added successfully.",
      });
      setShowAddStopModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add tour stop. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateStopMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTourStopRequest> }) => 
      tourService.updateTourStop(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      toast({
        title: "Tour Stop Updated",
        description: "Tour stop has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tour stop.",
        variant: "destructive",
      });
    }
  });

  const deleteStopMutation = useMutation({
    mutationFn: tourService.deleteTourStop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      queryClient.invalidateQueries({ queryKey: ['tour-statistics', tour.id] });
      toast({
        title: "Tour Stop Deleted",
        description: "Tour stop has been removed from the tour.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete tour stop.",
        variant: "destructive",
      });
    }
  });

  const bulkUpdateStopsMutation = useMutation({
    mutationFn: tourService.bulkUpdateTourStops,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-stops', tour.id] });
      toast({
        title: "Tour Order Updated",
        description: "Tour stop order has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tour order.",
        variant: "destructive",
      });
    }
  });

  // Helper functions
  const getStatusColor = (status: TourStopStatus): string => {
    const colors = {
      planned: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      postponed: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[status] || colors.planned;
  };

  const getStatusIcon = (status: TourStopStatus) => {
    const icons = {
      planned: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <AlertCircle className="w-4 h-4" />,
      postponed: <AlertCircle className="w-4 h-4" />
    };
    return icons[status] || icons.planned;
  };

  const formatCurrency = (amount: number, currency: string = 'AUD'): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateTravelTime = (fromStop: TourStop, toStop: TourStop): number => {
    // Simplified calculation - in reality would use Google Maps API
    const distance = fromStop.distance_to_next_km || 500; // Default 500km
    const avgSpeed = 80; // km/h average including stops
    return Math.round((distance / avgSpeed) * 60); // Return minutes
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || !isEditable) return;

    const items = Array.from(tourStops);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order_index for all stops
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

  // Auto-calculate travel times and distances when stops change
  useEffect(() => {
    if (tourStops.length > 1 && isEditable) {
      // Auto-update travel times between consecutive stops
      const updates: Array<{ id: string; data: Partial<TourStop> }> = [];
      
      tourStops.forEach((stop, index) => {
        if (index < tourStops.length - 1) {
          const nextStop = tourStops[index + 1];
          const travelTime = calculateTravelTime(stop, nextStop);
          
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
    }
  }, [tourStops.length]);

  const sortedStops = [...tourStops].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      {/* Header with tour overview */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Tour Planning - {tour.name}</h2>
          <div className="flex items-center gap-4 text-blue-200 text-sm">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{tourStops.length} stops</span>
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
            onClick={() => refetchStops()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          {isEditable && (
            <>
              <Button 
                variant="outline"
                className="border-purple-400/30 text-purple-200 hover:bg-purple-500/20"
                onClick={() => setDragEnabled(!dragEnabled)}
              >
                <Route className="w-4 h-4 mr-2" />
                {dragEnabled ? 'Lock Order' : 'Reorder Stops'}
              </Button>
              
              <Button 
                onClick={() => setShowAddStopModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stop
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tour statistics cards */}
      {tourStatistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Capacity</p>
                  <p className="text-2xl font-bold text-white">{tourStatistics.total_capacity.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-green-700/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Tickets Sold</p>
                  <p className="text-2xl font-bold text-white">{tourStatistics.tickets_sold.toLocaleString()}</p>
                  <p className="text-xs text-green-300">{tourStatistics.occupancy_rate.toFixed(1)}% occupancy</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Net Profit</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(tourStatistics.net_profit)}</p>
                  <p className="text-xs text-purple-300">{tourStatistics.profit_margin.toFixed(1)}% margin</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 border-orange-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(tourStatistics.total_revenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main planning interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
          {/* Tour stops list */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Route className="w-5 h-5" />
                Tour Stops
                {dragEnabled && (
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 ml-2">
                    Drag to reorder
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="tour-stops" isDropDisabled={!dragEnabled}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {sortedStops.map((stop, index) => (
                        <Draggable 
                          key={stop.id} 
                          draggableId={stop.id} 
                          index={index}
                          isDragDisabled={!dragEnabled}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 transition-all",
                                dragEnabled && "hover:border-purple-500/50 cursor-move",
                                snapshot.isDragging && "shadow-xl border-purple-500/50 bg-purple-900/20"
                              )}
                            >
                              <div className="flex items-center gap-4">
                                {dragEnabled && (
                                  <div {...provided.dragHandleProps} className="text-gray-400 hover:text-white">
                                    <Navigation className="w-5 h-5" />
                                  </div>
                                )}
                                
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                    {stop.order_index}
                                  </div>
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h3 className="text-white font-semibold text-lg">{stop.venue_name}</h3>
                                      <p className="text-blue-200">{stop.venue_city}, {stop.venue_state || stop.venue_country}</p>
                                      <p className="text-gray-400 text-sm">
                                        {new Date(stop.event_date).toLocaleDateString()} at {stop.show_time}
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <Badge className={cn("", getStatusColor(stop.status))}>
                                        {getStatusIcon(stop.status)}
                                        <span className="ml-1 capitalize">{stop.status}</span>
                                      </Badge>
                                      
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedStop(stop);
                                            setShowStopDetailsModal(true);
                                          }}
                                          className="text-blue-400 hover:text-blue-300"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </Button>
                                        
                                        {isEditable && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteStop(stop.id)}
                                            className="text-red-400 hover:text-red-300"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                    <div className="flex items-center text-sm text-gray-300">
                                      <Users className="w-4 h-4 mr-2 text-blue-400" />
                                      <span>
                                        {stop.tickets_sold.toLocaleString()} / {stop.venue_capacity?.toLocaleString() || 'TBD'} tickets
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center text-sm text-gray-300">
                                      <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                                      <span>{formatCurrency(stop.revenue)}</span>
                                    </div>
                                    
                                    {stop.travel_time_to_next && index < sortedStops.length - 1 && (
                                      <div className="flex items-center text-sm text-gray-300">
                                        <Clock className="w-4 h-4 mr-2 text-orange-400" />
                                        <span>{Math.round(stop.travel_time_to_next / 60)}h to next stop</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Travel connection to next stop */}
                              {index < sortedStops.length - 1 && (
                                <div className="mt-4 ml-6 flex items-center gap-2 text-gray-400 text-sm">
                                  <ArrowDown className="w-4 h-4" />
                                  <span>
                                    Travel to {sortedStops[index + 1].venue_city}
                                    {stop.distance_to_next_km && ` (${stop.distance_to_next_km}km)`}
                                    {stop.travel_time_to_next && ` - ${Math.round(stop.travel_time_to_next / 60)}h journey`}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              {/* Empty state */}
              {sortedStops.length === 0 && !stopsLoading && (
                <div className="text-center py-16">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-2">No tour stops yet</h3>
                  <p className="text-gray-400 mb-6">
                    Start planning your tour by adding the first stop!
                  </p>
                  {isEditable && (
                    <Button 
                      onClick={() => setShowAddStopModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Stop
                    </Button>
                  )}
                </div>
              )}
              
              {/* Loading state */}
              {stopsLoading && (
                <div className="flex justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading tour stops...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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

      {/* Add Stop Modal */}
      <AddTourStopModal
        isOpen={showAddStopModal}
        onClose={() => setShowAddStopModal(false)}
        tourId={tour.id}
        nextOrderIndex={(tourStops.length + 1)}
        onSubmit={createStopMutation.mutate}
        isLoading={createStopMutation.isPending}
      />

      {/* Stop Details Modal */}
      <TourStopDetailsModal
        isOpen={showStopDetailsModal}
        onClose={() => setShowStopDetailsModal(false)}
        stop={selectedStop}
        isEditable={isEditable}
        onUpdate={(data) => {
          if (selectedStop) {
            updateStopMutation.mutate({ id: selectedStop.id, data });
          }
        }}
        isLoading={updateStopMutation.isPending}
      />
    </div>
  );
};

// Additional component interfaces (simplified for space)
const TourTimelineView: React.FC<{ tour: Tour; stops: TourStop[] }> = ({ tour, stops }) => (
  <Card className="bg-slate-800/50 border-slate-700/50">
    <CardHeader>
      <CardTitle className="text-white">Tour Timeline</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-400">Timeline view coming soon...</p>
    </CardContent>
  </Card>
);

const TourLogisticsView: React.FC<{ tour: Tour; stops: TourStop[]; logistics: TourLogistics[] }> = ({ tour, stops, logistics }) => (
  <Card className="bg-slate-800/50 border-slate-700/50">
    <CardHeader>
      <CardTitle className="text-white">Logistics Management</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-400">Logistics management coming soon...</p>
    </CardContent>
  </Card>
);

const TourMapView: React.FC<{ tour: Tour; stops: TourStop[] }> = ({ tour, stops }) => (
  <Card className="bg-slate-800/50 border-slate-700/50">
    <CardHeader>
      <CardTitle className="text-white">Route Map</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-400">Interactive map coming soon...</p>
    </CardContent>
  </Card>
);

// Add Stop Modal Component (simplified)
interface AddTourStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  nextOrderIndex: number;
  onSubmit: (data: CreateTourStopRequest) => void;
  isLoading: boolean;
}

const AddTourStopModal: React.FC<AddTourStopModalProps> = ({
  isOpen,
  onClose,
  tourId,
  nextOrderIndex,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<Partial<CreateTourStopRequest>>({
    tour_id: tourId,
    order_index: nextOrderIndex,
    venue_country: 'Australia',
    show_duration_minutes: 120
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.venue_name && formData.venue_city && formData.event_date && formData.show_time) {
      onSubmit(formData as CreateTourStopRequest);
      setFormData({
        tour_id: tourId,
        order_index: nextOrderIndex + 1,
        venue_country: 'Australia',
        show_duration_minutes: 120
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Tour Stop</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Venue Name *</label>
              <Input
                required
                placeholder="e.g., The Comedy Store"
                value={formData.venue_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, venue_name: e.target.value }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">City *</label>
              <Input
                required
                placeholder="e.g., Sydney"
                value={formData.venue_city || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, venue_city: e.target.value }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Date *</label>
              <Input
                required
                type="date"
                value={formData.event_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Show Time *</label>
              <Input
                required
                type="time"
                value={formData.show_time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, show_time: e.target.value }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Venue Capacity</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.venue_capacity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, venue_capacity: parseInt(e.target.value) || undefined }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Ticket Price</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.ticket_price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ticket_price: parseFloat(e.target.value) || undefined }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Venue Address</label>
            <Textarea
              placeholder="Full venue address..."
              value={formData.venue_address || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, venue_address: e.target.value }))}
              className="bg-slate-900/50 border-slate-600/50 text-white h-20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? 'Adding...' : 'Add Stop'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Stop Details Modal Component (simplified)
interface TourStopDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stop: TourStop | null;
  isEditable: boolean;
  onUpdate: (data: Partial<CreateTourStopRequest>) => void;
  isLoading: boolean;
}

const TourStopDetailsModal: React.FC<TourStopDetailsModalProps> = ({
  isOpen,
  onClose,
  stop,
  isEditable,
  onUpdate,
  isLoading
}) => {
  if (!stop) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {stop.venue_name} - {stop.venue_city}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Event Details</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">Date:</span> {new Date(stop.event_date).toLocaleDateString()}</p>
                <p><span className="text-gray-400">Show Time:</span> {stop.show_time}</p>
                <p><span className="text-gray-400">Duration:</span> {stop.show_duration_minutes} minutes</p>
                <p><span className="text-gray-400">Capacity:</span> {stop.venue_capacity?.toLocaleString() || 'TBD'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Sales & Revenue</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">Tickets Sold:</span> {stop.tickets_sold.toLocaleString()}</p>
                <p><span className="text-gray-400">Revenue:</span> ${stop.revenue.toLocaleString()}</p>
                <p><span className="text-gray-400">Expenses:</span> ${stop.expenses.toLocaleString()}</p>
                <p><span className="text-gray-400">Ticket Price:</span> ${stop.ticket_price || 'TBD'}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Close
            </Button>
            {isEditable && (
              <Button
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Edit Details
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TourPlanningWorkspace;