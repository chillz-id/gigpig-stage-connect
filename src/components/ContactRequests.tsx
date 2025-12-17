
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Clock, CheckCircle, X, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ContactRequest {
  id: string;
  requester_id: string;
  comedian_id: string;
  request_type: 'manager' | 'agent' | 'both';
  message: string | null;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  response_message: string | null;
  requester?: {
    name: string;
    avatar_url: string;
    is_verified: boolean;
  };
}

export const ContactRequests: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);

  // Fetch contact requests for the current user (comedian)
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['contact-requests'],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('contact_requests')
        .select(`
          *,
          requester:profiles!contact_requests_requester_id_fkey (
            name,
            avatar_url,
            is_verified
          )
        `)
        .eq('comedian_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface with proper type assertion
      return (data || []).map(request => ({
        ...request,
        request_type: request.request_type as 'manager' | 'agent' | 'both',
        status: request.status as 'pending' | 'approved' | 'denied',
        requester: request.requester ? {
          name: request.requester.name || 'Unknown User',
          avatar_url: request.requester.avatar_url || '',
          is_verified: request.requester.is_verified || false
        } : undefined
      })) as ContactRequest[];
    }
  });

  // Mutation to approve/deny contact requests
  const updateRequestMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      status, 
      responseMessage 
    }: { 
      requestId: string; 
      status: 'approved' | 'denied'; 
      responseMessage?: string;
    }) => {
      const { error } = await supabase
        .from('contact_requests')
        .update({ 
          status, 
          response_message: responseMessage,
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact-requests'] });
      toast({
        title: variables.status === 'approved' ? "Request Approved" : "Request Denied",
        description: variables.status === 'approved' 
          ? "Contact information has been shared with the promoter."
          : "The contact request has been declined.",
      });
      setIsResponseDialogOpen(false);
      setSelectedRequest(null);
      setResponseMessage('');
    }
  });

  const handleApprove = (requestId: string) => {
    updateRequestMutation.mutate({ 
      requestId, 
      status: 'approved', 
      responseMessage: responseMessage || undefined 
    });
  };

  const handleDeny = (requestId: string, reason?: string) => {
    updateRequestMutation.mutate({ 
      requestId, 
      status: 'denied', 
      responseMessage: reason 
    });
  };

  const openResponseDialog = (request: ContactRequest) => {
    setSelectedRequest(request);
    setResponseMessage('');
    setIsResponseDialogOpen(true);
  };

  const getRequestTypeText = (type: string) => {
    switch (type) {
      case 'manager':
        return 'Manager Contact';
      case 'agent':
        return 'Agent Contact';
      case 'both':
        return 'Manager & Agent Contact';
      default:
        return 'Contact Information';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="professional-card">
          <CardContent className="p-8">
            <div className="text-center">Loading contact requests...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact Requests
          </CardTitle>
          <CardDescription>
            Manage requests from promoters for your management and agent contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Contact Requests</h3>
              <p className="text-muted-foreground">
                You'll see requests from promoters here when they want to contact your management or agent
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <OptimizedAvatar
                      src={request.requester?.avatar_url}
                      name={request.requester?.name || 'U'}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {request.requester?.name || 'Unknown User'}
                        </span>
                        {request.requester?.is_verified && (
                          <Badge className="professional-button">Verified</Badge>
                        )}
                        <Badge className="professional-button">Promoter</Badge>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <Badge variant="secondary" className="mb-2">
                          {getRequestTypeText(request.request_type)}
                        </Badge>
                        {request.message && (
                          <p className="text-sm text-muted-foreground">{request.message}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openResponseDialog(request)}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={updateRequestMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              className="professional-button"
                              onClick={() => handleDeny(request.id)}
                              disabled={updateRequestMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Deny
                            </Button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                        {request.status === 'denied' && (
                          <Badge variant="destructive">
                            <X className="w-3 h-3 mr-1" />
                            Denied
                          </Badge>
                        )}
                        {request.status === 'pending' && (
                          <Badge className="professional-button">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve Contact Request</DialogTitle>
            <DialogDescription>
              This will share your {selectedRequest && getRequestTypeText(selectedRequest.request_type).toLowerCase()} with {selectedRequest?.requester?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Optional message to promoter</label>
              <Textarea
                placeholder="Add a personal message (optional)..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => selectedRequest && handleApprove(selectedRequest.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={updateRequestMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {updateRequestMutation.isPending ? 'Approving...' : 'Approve & Share Contact'}
              </Button>
              <Button
                className="professional-button"
                onClick={() => setIsResponseDialogOpen(false)}
                disabled={updateRequestMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
