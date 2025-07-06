// Tour Dashboard - Comprehensive tour management dashboard
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Music,
  Plane,
  Building,
  Target,
  BarChart3,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share2,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { tourService } from '@/services/tourService';
import { taskService } from '@/services/taskService';
import { cn } from '@/lib/utils';
import type { 
  Tour, 
  TourStatus, 
  TourDashboardStats, 
  TourSearchParams, 
  TourCalendarEvent,
  CreateTourRequest 
} from '@/types/tour';

const TourDashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TourStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Queries
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['tour-dashboard-stats', user?.id],
    queryFn: () => tourService.getTourDashboardStats(user?.id),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000
  });

  const { data: toursData, isLoading: toursLoading, refetch: refetchTours } = useQuery({
    queryKey: ['tours', searchQuery, selectedStatus, user?.id],
    queryFn: () => {
      const params: TourSearchParams = {
        query: searchQuery || undefined,
        filters: {
          status: selectedStatus !== 'all' ? [selectedStatus] : undefined,
          manager_id: user?.id
        },
        sort_by: 'start_date',
        sort_order: 'asc',
        limit: 50
      };
      return tourService.getTours(params);
    },
    staleTime: 5000
  });

  const { data: calendarEvents } = useQuery({
    queryKey: ['tour-calendar-events', user?.id],
    queryFn: async () => {
      const tours = toursData?.tours || [];
      const allEvents: TourCalendarEvent[] = [];
      
      for (const tour of tours) {
        const events = await tourService.getTourCalendarEvents(tour.id);
        allEvents.push(...events);
      }
      
      return allEvents;
    },
    enabled: !!toursData?.tours,
    staleTime: 10000
  });

  // Mutations
  const createTourMutation = useMutation({
    mutationFn: tourService.createTour,
    onSuccess: (newTour) => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      queryClient.invalidateQueries({ queryKey: ['tour-dashboard-stats'] });
      toast({
        title: "Tour Created",
        description: `${newTour.name} has been created successfully.`,
      });
      setShowCreateModal(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create tour. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteTourMutation = useMutation({
    mutationFn: tourService.deleteTour,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      queryClient.invalidateQueries({ queryKey: ['tour-dashboard-stats'] });
      toast({
        title: "Tour Deleted",
        description: "Tour has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete tour. Please try again.",
        variant: "destructive",
      });
    }
  });

  const duplicateTourMutation = useMutation({
    mutationFn: ({ tourId, newName }: { tourId: string; newName: string }) => 
      tourService.duplicateTour(tourId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      toast({
        title: "Tour Duplicated",
        description: "Tour has been duplicated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to duplicate tour. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['tour-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tour-calendar-events'] });
    }, 60000); // Refresh every minute

    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [queryClient]);

  // Helper functions
  const getStatusColor = (status: TourStatus): string => {
    const colors = {
      planning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      postponed: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[status] || colors.planning;
  };

  const getStatusIcon = (status: TourStatus) => {
    const icons = {
      planning: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      in_progress: <TrendingUp className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
      postponed: <AlertCircle className="w-4 h-4" />
    };
    return icons[status] || icons.planning;
  };

  const formatCurrency = (amount: number, currency: string = 'AUD'): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleCreateTour = (formData: CreateTourRequest) => {
    createTourMutation.mutate(formData);
  };

  const handleDeleteTour = (tourId: string) => {
    if (window.confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
      deleteTourMutation.mutate(tourId);
    }
  };

  const handleDuplicateTour = (tour: Tour) => {
    const newName = prompt('Enter name for the duplicated tour:', `${tour.name} (Copy)`);
    if (newName) {
      duplicateTourMutation.mutate({ tourId: tour.id, newName });
    }
  };

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900';
  };

  const tours = toursData?.tours || [];
  const isLoading = statsLoading || toursLoading;

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Tour Management</h1>
              <p className="text-blue-200">Manage your comedy tours, shows, and collaborations</p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="border-blue-400/30 text-blue-200 hover:bg-blue-500/20"
                onClick={() => refetchTours()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Tour
              </Button>
            </div>
          </div>

          {/* Dashboard Stats */}
          {dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Tours</p>
                      <p className="text-3xl font-bold text-white">{dashboardStats.total_tours}</p>
                    </div>
                    <Music className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Active Tours</p>
                      <p className="text-3xl font-bold text-white">{dashboardStats.active_tours}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
                      <p className="text-3xl font-bold text-white">
                        {formatCurrency(dashboardStats.total_revenue)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Upcoming Shows</p>
                      <p className="text-3xl font-bold text-white">{dashboardStats.upcoming_shows}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters and Search */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search tours..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-900/50 border-slate-600/50 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-48 bg-slate-900/50 border-slate-600/50 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="postponed">Postponed</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex border rounded-lg bg-slate-900/50 border-slate-600/50">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-none"
                    >
                      <Target className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('calendar')}
                      className="rounded-l-none"
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tours List/Grid */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => (
                <Card key={tour.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg mb-2">{tour.name}</CardTitle>
                        <Badge className={cn("mb-2", getStatusColor(tour.status))}>
                          {getStatusIcon(tour.status)}
                          <span className="ml-1 capitalize">{tour.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* Navigate to tour details */}}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTour(tour)}
                          className="text-green-400 hover:text-green-300"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTour(tour.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {tour.description && (
                        <p className="text-gray-300 text-sm line-clamp-2">{tour.description}</p>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {tour.start_date ? (
                          <span>
                            {new Date(tour.start_date).toLocaleDateString()} - {' '}
                            {tour.end_date ? new Date(tour.end_date).toLocaleDateString() : 'TBD'}
                          </span>
                        ) : (
                          <span>Dates TBD</span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Revenue: {formatCurrency(tour.actual_revenue)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-400">
                        <Users className="w-4 h-4 mr-2" />
                        <span>Sold: {tour.tickets_sold.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {tours.length === 0 && !isLoading && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="py-16 text-center">
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-white mb-2">No tours found</h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery || selectedStatus !== 'all' 
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first tour"
                  }
                </p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Tour
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading tours...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Tour Modal */}
      <CreateTourModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTour}
        isLoading={createTourMutation.isPending}
      />
    </div>
  );
};

// Create Tour Modal Component
interface CreateTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTourRequest) => void;
  isLoading: boolean;
}

const CreateTourModal: React.FC<CreateTourModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}) => {
  const [formData, setFormData] = useState<CreateTourRequest>({
    name: '',
    description: '',
    tour_type: 'comedy',
    currency: 'AUD',
    is_public: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      description: '',
      tour_type: 'comedy',
      currency: 'AUD',
      is_public: false
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Tour</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tour Name *</label>
              <Input
                required
                placeholder="e.g., Comedy Gold Tour 2024"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Tour Type</label>
              <Select 
                value={formData.tour_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tour_type: value }))}
              >
                <SelectTrigger className="bg-slate-900/50 border-slate-600/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="comedy">Comedy</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              placeholder="Brief description of the tour..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <Input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Budget</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.budget || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || undefined }))}
                className="bg-slate-900/50 border-slate-600/50 text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="rounded border-slate-600 bg-slate-900"
            />
            <label htmlFor="is_public" className="text-sm">
              Make this tour publicly visible
            </label>
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
              {isLoading ? 'Creating...' : 'Create Tour'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TourDashboard;