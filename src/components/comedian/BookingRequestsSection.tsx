import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  MessageCircle,
  Check,
  X,
  AlertCircle,
  Users,
  Mic,
  Timer
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BookingRequest {
  id: string;
  requester_id: string;
  event_date: string;
  event_time: string;
  venue: string;
  budget?: number;
  requested_comedian_id?: string;
  notes?: string;
  status: string;
  created_at: string;
  event_title?: string;
  event_type?: string;
  expected_audience_size?: number;
  performance_duration?: number;
  technical_requirements?: string;
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  my_response?: {
    id: string;
    response_type: string;
    proposed_fee?: number;
    counter_offer_notes?: string;
    response_message?: string;
  };
}

export const BookingRequestsSection: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [responseForm, setResponseForm] = useState({
    response_type: '',
    proposed_fee: '',
    counter_offer_notes: '',
    response_message: ''
  });

  // Fetch booking requests
  const { data: bookingRequests = [], isLoading } = useQuery({
    queryKey: ['comedian-booking-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch general requests and specific requests for this comedian
      const { data, error } = await supabase
        .from('booking_requests')
        .select('*')
        .or(`requested_comedian_id.eq.${user.id},requested_comedian_id.is.null`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Return requests without attempting to join non-existent foreign keys
      return data || [];
    },
    enabled: !!user?.id
  });

  // Respond to booking request
  const respondToRequest = useMutation({
    mutationFn: async (data: {
      booking_request_id: string;
      response_type: string;
      proposed_fee?: number;
      counter_offer_notes?: string;
      response_message?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('booking_request_responses')
        .upsert({
          comedian_id: user.id,
          ...data
        }, {
          onConflict: 'booking_request_id,comedian_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: "Your response has been sent to the requester.",
      });
      queryClient.invalidateQueries({ queryKey: ['comedian-booking-requests'] });
      setSelectedRequest(null);
      setResponseForm({
        response_type: '',
        proposed_fee: '',
        counter_offer_notes: '',
        response_message: ''
      });
    },
    onError: (error) => {
      console.error('Error responding to request:', error);
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleRespond = () => {
    if (!selectedRequest || !responseForm.response_type) {
      toast({
        title: "Missing Information",
        description: "Please select a response type.",
        variant: "destructive",
      });
      return;
    }

    respondToRequest.mutate({
      booking_request_id: selectedRequest.id,
      response_type: responseForm.response_type,
      proposed_fee: responseForm.proposed_fee ? parseFloat(responseForm.proposed_fee) : undefined,
      counter_offer_notes: responseForm.counter_offer_notes || undefined,
      response_message: responseForm.response_message || undefined
    });
  };

  const getRequestTypeLabel = (request: BookingRequest) => {
    return request.requested_comedian_id === user?.id ? 'Direct Request' : 'Open Request';
  };

  const getRequestTypeBadgeColor = (request: BookingRequest) => {
    return request.requested_comedian_id === user?.id ? 'bg-purple-500' : 'bg-blue-500';
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <Calendar className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-2xl flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-400" />
          Booking Requests
        </CardTitle>
        <CardDescription className="text-gray-300">
          Respond to booking requests from promoters
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {bookingRequests.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No booking requests</h3>
            <p className="text-gray-500">New booking requests will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Requests List */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Active Requests</h3>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {bookingRequests.map((request) => (
                    <Card
                      key={request.id}
                      className={`bg-slate-700/50 border-slate-600 cursor-pointer transition-all ${
                        selectedRequest?.id === request.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => {
                        setSelectedRequest(request);
                        setResponseForm({
                          response_type: '',
                          proposed_fee: request.budget?.toString() || '',
                          counter_offer_notes: '',
                          response_message: ''
                        });
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-white font-medium">
                              {request.event_title || 'Comedy Event'}
                            </h4>
                            <p className="text-sm text-gray-400">
                              Booking Request
                            </p>
                          </div>
                          <Badge className={getRequestTypeBadgeColor(request)}>
                            {getRequestTypeLabel(request)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(request.event_date), 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span>{request.event_time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-4 h-4" />
                            <span>{request.venue}</span>
                          </div>
                          {request.budget && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <DollarSign className="w-4 h-4" />
                              <span>${request.budget}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Request Details & Response Form */}
            <div>
              {selectedRequest ? (
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">
                      Request Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Full Request Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-medium mb-2">Event Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(selectedRequest.event_date), 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span>{selectedRequest.event_time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-4 h-4" />
                            <span>{selectedRequest.venue}</span>
                          </div>
                          {selectedRequest.expected_audience_size && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Users className="w-4 h-4" />
                              <span>{selectedRequest.expected_audience_size} expected audience</span>
                            </div>
                          )}
                          {selectedRequest.performance_duration && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Timer className="w-4 h-4" />
                              <span>{selectedRequest.performance_duration} minute set</span>
                            </div>
                          )}
                          {selectedRequest.event_type && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Mic className="w-4 h-4" />
                              <span>{selectedRequest.event_type}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedRequest.notes && (
                        <div>
                          <h4 className="text-white font-medium mb-2">Additional Notes</h4>
                          <p className="text-gray-300 text-sm">{selectedRequest.notes}</p>
                        </div>
                      )}

                      {selectedRequest.technical_requirements && (
                        <div>
                          <h4 className="text-white font-medium mb-2">Technical Requirements</h4>
                          <p className="text-gray-300 text-sm">{selectedRequest.technical_requirements}</p>
                        </div>
                      )}
                    </div>

                    {/* Response Form */}
                    <div className="border-t border-slate-600 pt-6">
                      <h4 className="text-white font-medium mb-4">Your Response</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-300">Response Type</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <Button
                              type="button"
                              variant={responseForm.response_type === 'accepted' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setResponseForm(prev => ({ ...prev, response_type: 'accepted' }))}
                              className="justify-start"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              type="button"
                              variant={responseForm.response_type === 'declined' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setResponseForm(prev => ({ ...prev, response_type: 'declined' }))}
                              className="justify-start"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                            <Button
                              type="button"
                              variant={responseForm.response_type === 'negotiating' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setResponseForm(prev => ({ ...prev, response_type: 'negotiating' }))}
                              className="justify-start"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Negotiate
                            </Button>
                            <Button
                              type="button"
                              variant={responseForm.response_type === 'interested' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setResponseForm(prev => ({ ...prev, response_type: 'interested' }))}
                              className="justify-start"
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Interested
                            </Button>
                          </div>
                        </div>

                        {responseForm.response_type && responseForm.response_type !== 'declined' && (
                          <>
                            <div>
                              <Label htmlFor="proposed-fee" className="text-gray-300">
                                Your Fee {responseForm.response_type === 'negotiating' && '(Counter Offer)'}
                              </Label>
                              <div className="relative mt-1">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="proposed-fee"
                                  type="number"
                                  placeholder="Enter your fee"
                                  className="pl-10 bg-slate-600 border-slate-500 text-white"
                                  value={responseForm.proposed_fee}
                                  onChange={(e) => setResponseForm(prev => ({ ...prev, proposed_fee: e.target.value }))}
                                />
                              </div>
                            </div>

                            {responseForm.response_type === 'negotiating' && (
                              <div>
                                <Label htmlFor="counter-notes" className="text-gray-300">
                                  Counter Offer Notes
                                </Label>
                                <Textarea
                                  id="counter-notes"
                                  placeholder="Explain your counter offer..."
                                  className="bg-slate-600 border-slate-500 text-white mt-1"
                                  value={responseForm.counter_offer_notes}
                                  onChange={(e) => setResponseForm(prev => ({ ...prev, counter_offer_notes: e.target.value }))}
                                  rows={3}
                                />
                              </div>
                            )}
                          </>
                        )}

                        <div>
                          <Label htmlFor="response-message" className="text-gray-300">
                            Message to Requester
                          </Label>
                          <Textarea
                            id="response-message"
                            placeholder="Add a personal message..."
                            className="bg-slate-600 border-slate-500 text-white mt-1"
                            value={responseForm.response_message}
                            onChange={(e) => setResponseForm(prev => ({ ...prev, response_message: e.target.value }))}
                            rows={4}
                          />
                        </div>

                        <Button
                          onClick={handleRespond}
                          disabled={!responseForm.response_type || respondToRequest.isPending}
                          className="w-full"
                        >
                          {respondToRequest.isPending ? 'Sending...' : 'Send Response'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="bg-slate-700/30 border-2 border-dashed border-slate-600 rounded-lg p-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-400">Select a request</h3>
                  <p className="text-gray-500 mt-2">Click on a booking request to view details and respond</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingRequestsSection;