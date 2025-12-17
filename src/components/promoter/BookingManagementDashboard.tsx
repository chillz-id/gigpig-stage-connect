import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  MessageCircle,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  Mail,
  Phone
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  bookingRequestService,
  BookingRequestWithResponses,
  BookingRequestStatus
} from '@/services/bookingRequestService';

export const BookingManagementDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestWithResponses | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'accepted' | 'archived'>('active');

  // Fetch booking requests with responses using centralized service
  const { data: bookingRequests = [], isLoading } = useQuery({
    queryKey: ['promoter-booking-requests', user?.id, activeTab],
    queryFn: async () => {
      if (!user?.id) return [];

      // Map tab to status filter
      let statusFilter: BookingRequestStatus | BookingRequestStatus[];
      if (activeTab === 'active') {
        statusFilter = 'pending';
      } else if (activeTab === 'accepted') {
        statusFilter = 'accepted';
      } else {
        statusFilter = ['cancelled', 'completed'];
      }

      return bookingRequestService.listByRequester(user.id, statusFilter);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Accept a comedian's response using centralized service
  const acceptResponse = useMutation({
    mutationFn: async ({ requestId, comedianId }: { requestId: string; comedianId: string }) => {
      return bookingRequestService.acceptComedianResponse(requestId, comedianId, true);
    },
    onSuccess: () => {
      toast({
        title: "Response Accepted",
        description: "The comedian has been notified and the booking is confirmed.",
      });
      queryClient.invalidateQueries({ queryKey: ['promoter-booking-requests'] });
    },
    onError: (error) => {
      console.error('Error accepting response:', error);
      toast({
        title: "Error",
        description: "Failed to accept response. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getResponseTypeIcon = (type: string) => {
    switch (type) {
      case 'accepted':
        return <Check className="w-4 h-4" />;
      case 'declined':
        return <X className="w-4 h-4" />;
      case 'negotiating':
        return <MessageCircle className="w-4 h-4" />;
      case 'interested':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'accepted':
        return 'bg-green-500';
      case 'declined':
        return 'bg-red-500';
      case 'negotiating':
        return 'bg-yellow-500';
      case 'interested':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <Calendar className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            Booking Management
          </CardTitle>
          <CardDescription>
            Manage your booking requests and comedian responses
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="active">Active ({bookingRequests.filter(r => r.status === 'pending').length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({bookingRequests.filter(r => r.status === 'accepted').length})</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {bookingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No {activeTab} requests</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'active' 
                      ? "Create a booking request to find comedians for your events"
                      : `No ${activeTab} booking requests yet`
                    }
                  </p>
                  {activeTab === 'active' && (
                    <Button onClick={() => navigate('/book-comedian')}>
                      Create Booking Request
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Requests List */}
                  <div>
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-4">
                        {bookingRequests.map((request) => (
                          <Card
                            key={request.id}
                            className={`cursor-pointer transition-all ${
                              selectedRequest?.id === request.id ? 'ring-2 ring-purple-500' : ''
                            }`}
                            onClick={() => setSelectedRequest(request)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-medium">
                                    {request.event_title || 'Comedy Event'}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(request.event_date), 'PPP')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {request.responses.length > 0 && (
                                    <Badge variant="secondary">
                                      {request.responses.length} responses
                                    </Badge>
                                  )}
                                  <Badge className={
                                    request.status === 'pending' ? 'bg-yellow-500' :
                                    request.status === 'accepted' ? 'bg-green-500' :
                                    'bg-gray-500'
                                  }>
                                    {request.status}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="w-4 h-4" />
                                  <span>{request.venue}</span>
                                </div>
                                {request.budget && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <DollarSign className="w-4 h-4" />
                                    <span>Budget: ${request.budget}</span>
                                  </div>
                                )}
                              </div>

                              {request.responses.length > 0 && (
                                <div className="mt-3 flex -space-x-2">
                                  {request.responses.slice(0, 3).map((response) => (
                                    <OptimizedAvatar
                                      key={response.id}
                                      src={response.comedian.profile_image_url}
                                      name={response.comedian.name || 'Comedian'}
                                      className="w-8 h-8 border-2 border-background"
                                    />
                                  ))}
                                  {request.responses.length > 3 && (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                                      +{request.responses.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Request Details & Responses */}
                  <div>
                    {selectedRequest ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {selectedRequest.event_title || 'Comedy Event'}
                          </CardTitle>
                          <CardDescription>
                            {selectedRequest.responses.length} comedian{selectedRequest.responses.length !== 1 ? 's' : ''} responded
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Event Details */}
                          <div className="pb-4 border-b">
                            <h4 className="font-medium mb-3">Event Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{format(new Date(selectedRequest.event_date), 'PPP')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{selectedRequest.event_time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{selectedRequest.venue}</span>
                              </div>
                            </div>
                          </div>

                          {/* Comedian Responses */}
                          <div>
                            <h4 className="font-medium mb-3">Comedian Responses</h4>
                            <ScrollArea className="h-[400px]">
                              <div className="space-y-4">
                                {selectedRequest.responses.length === 0 ? (
                                  <p className="text-muted-foreground text-center py-8">
                                    No responses yet. Comedians will be notified of your request.
                                  </p>
                                ) : (
                                  selectedRequest.responses.map((response) => (
                                    <Card key={response.id} className="bg-muted/50">
                                      <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                          <OptimizedAvatar
                                            src={response.comedian.profile_image_url}
                                            name={response.comedian.name || 'Comedian'}
                                            className="w-12 h-12"
                                          />
                                          
                                          <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                              <div>
                                                <h5 className="font-medium">
                                                  {response.comedian.stage_name || response.comedian.name}
                                                </h5>
                                                <p className="text-sm text-muted-foreground">
                                                  Responded {format(new Date(response.created_at), 'PP')}
                                                </p>
                                              </div>
                                              <Badge className={getResponseTypeColor(response.response_type)}>
                                                <span className="flex items-center gap-1">
                                                  {getResponseTypeIcon(response.response_type)}
                                                  {response.response_type}
                                                </span>
                                              </Badge>
                                            </div>

                                            {response.proposed_fee && (
                                              <div className="flex items-center gap-2 mb-2">
                                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">${response.proposed_fee}</span>
                                                {selectedRequest.budget && response.proposed_fee !== selectedRequest.budget && (
                                                  <span className="text-sm text-muted-foreground">
                                                    (Budget: ${selectedRequest.budget})
                                                  </span>
                                                )}
                                              </div>
                                            )}

                                            {response.response_message && (
                                              <p className="text-sm text-muted-foreground mb-3">
                                                {response.response_message}
                                              </p>
                                            )}

                                            {response.counter_offer_notes && (
                                              <div className="bg-background/50 rounded p-2 mb-3">
                                                <p className="text-sm">{response.counter_offer_notes}</p>
                                              </div>
                                            )}

                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={() => navigate(`/comedians/${response.comedian_id}`)}
                                              >
                                                View Profile
                                              </Button>
                                              
                                              {selectedRequest.status === 'pending' && 
                                               response.response_type !== 'declined' && (
                                                <Button
                                                  size="sm"
                                                  variant="default"
                                                  onClick={() => acceptResponse.mutate({
                                                    requestId: selectedRequest.id,
                                                    comedianId: response.comedian_id
                                                  })}
                                                  disabled={acceptResponse.isPending}
                                                >
                                                  Accept & Book
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-lg p-12 text-center">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium text-muted-foreground">Select a request</h3>
                        <p className="text-muted-foreground mt-2">
                          Click on a booking request to view details and responses
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingManagementDashboard;