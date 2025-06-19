
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Phone, User, Clock, CheckCircle, X, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContactRequest {
  id: string;
  from: {
    name: string;
    avatar: string;
    role: 'promoter' | 'comedian';
    verified: boolean;
  };
  to: {
    name: string;
    avatar: string;
  };
  requestType: 'manager' | 'agent' | 'both';
  message: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  reason?: string;
}

const mockRequests: ContactRequest[] = [
  {
    id: '1',
    from: {
      name: 'Sarah Johnson',
      avatar: '/placeholder.svg',
      role: 'promoter',
      verified: true
    },
    to: {
      name: 'Mike Chen',
      avatar: '/placeholder.svg'
    },
    requestType: 'manager',
    message: 'Hi Mike, I have a great opportunity for a corporate event next month. Would love to connect with your management team to discuss details and booking.',
    status: 'pending',
    createdAt: '2024-12-18'
  },
  {
    id: '2',
    from: {
      name: 'Emma Davis',
      avatar: '/placeholder.svg',
      role: 'promoter',
      verified: true
    },
    to: {
      name: 'Alex Rodriguez',
      avatar: '/placeholder.svg'
    },
    requestType: 'both',
    message: 'Hello Alex, I\'m organizing a comedy festival and would like to reach out to your representation regarding potential headlining opportunities.',
    status: 'approved',
    createdAt: '2024-12-17'
  }
];

export const ContactRequests: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ContactRequest[]>(mockRequests);
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);

  const handleApprove = (requestId: string) => {
    setRequests(prev => prev.map(request =>
      request.id === requestId
        ? { ...request, status: 'approved' as const }
        : request
    ));
    toast({
      title: "Request Approved",
      description: "Contact information has been shared with the promoter.",
    });
    setIsResponseDialogOpen(false);
  };

  const handleDeny = (requestId: string, reason?: string) => {
    setRequests(prev => prev.map(request =>
      request.id === requestId
        ? { ...request, status: 'denied' as const, reason }
        : request
    ));
    toast({
      title: "Request Denied",
      description: "The contact request has been declined.",
    });
    setIsResponseDialogOpen(false);
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
                    <Avatar>
                      <AvatarImage src={request.from.avatar} />
                      <AvatarFallback>{request.from.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{request.from.name}</span>
                        {request.from.verified && <Badge variant="outline">Verified</Badge>}
                        <Badge variant="outline">{request.from.role}</Badge>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{request.createdAt}</span>
                      </div>
                      
                      <div className="mb-3">
                        <Badge variant="secondary" className="mb-2">
                          {getRequestTypeText(request.requestType)}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{request.message}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openResponseDialog(request)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeny(request.id)}
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
                          <Badge variant="outline">
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
              This will share your {selectedRequest && getRequestTypeText(selectedRequest.requestType).toLowerCase()} with {selectedRequest?.from.name}
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
              >
                <Send className="w-4 h-4 mr-2" />
                Approve & Share Contact
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsResponseDialogOpen(false)}
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
