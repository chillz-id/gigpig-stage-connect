import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getPendingOrganizationRequests,
  getPendingManagerRequests,
  approveOrganizationRequest,
  rejectOrganizationRequest,
  approveManagerRequest,
  rejectManagerRequest,
  type OrganizationJoinRequest,
  type ManagerClientRequest,
} from '@/services/requestApprovalService';

interface PendingRequestsListProps {
  userId: string;
}

export const PendingRequestsList: React.FC<PendingRequestsListProps> = ({ userId }) => {
  const [orgRequests, setOrgRequests] = useState<OrganizationJoinRequest[]>([]);
  const [managerRequests, setManagerRequests] = useState<ManagerClientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { toast } = useToast();

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const [orgReqs, mgrReqs] = await Promise.all([
        getPendingOrganizationRequests(userId),
        getPendingManagerRequests(userId),
      ]);

      setOrgRequests(orgReqs);
      setManagerRequests(mgrReqs);
    } catch (error: any) {
      console.error('Load requests error:', error);
      toast({
        title: 'Failed to load requests',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [userId]);

  const handleApproveOrgRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await approveOrganizationRequest(requestId, userId);

      toast({
        title: 'Request approved!',
        description: 'The user has been added to the organization.',
      });

      await loadRequests();
    } catch (error: any) {
      console.error('Approve org request error:', error);
      toast({
        title: 'Failed to approve request',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectOrgRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await rejectOrganizationRequest(requestId, userId);

      toast({
        title: 'Request rejected',
        description: 'The join request has been declined.',
      });

      await loadRequests();
    } catch (error: any) {
      console.error('Reject org request error:', error);
      toast({
        title: 'Failed to reject request',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveManagerRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await approveManagerRequest(requestId, userId);

      toast({
        title: 'Manager request approved!',
        description: 'The manager relationship has been created.',
      });

      await loadRequests();
    } catch (error: any) {
      console.error('Approve manager request error:', error);
      toast({
        title: 'Failed to approve request',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectManagerRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await rejectManagerRequest(requestId);

      toast({
        title: 'Manager request rejected',
        description: 'The management request has been declined.',
      });

      await loadRequests();
    } catch (error: any) {
      console.error('Reject manager request error:', error);
      toast({
        title: 'Failed to reject request',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const totalRequests = orgRequests.length + managerRequests.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading requests...
        </CardContent>
      </Card>
    );
  }

  if (totalRequests === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No pending requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Requests</CardTitle>
        <CardDescription>
          Review and respond to pending organization and manager requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="organization" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization ({orgRequests.length})
            </TabsTrigger>
            <TabsTrigger value="manager" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Manager ({managerRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization" className="space-y-4 mt-4">
            {orgRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending organization requests
              </div>
            ) : (
              orgRequests.map((request) => {
                const requesterName =
                  request.requester?.display_name ||
                  `${request.requester?.first_name || ''} ${request.requester?.last_name || ''}`.trim() ||
                  request.requester?.email ||
                  'Unknown User';

                return (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{requesterName}</span>
                            <Badge className="professional-button capitalize">
                              {request.requested_role}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Wants to join <strong>{request.organization?.name || 'Unknown Org'}</strong>
                            {request.organization?.type && (
                              <span className="capitalize"> ({request.organization.type})</span>
                            )}
                          </div>
                          {request.message && (
                            <div className="text-sm bg-muted p-3 rounded-md mt-2">
                              <p className="italic">"{request.message}"</p>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {formatDate(request.created_at)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="professional-button"
                            onClick={() => handleRejectOrgRequest(request.id)}
                            disabled={processingId === request.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveOrgRequest(request.id)}
                            disabled={processingId === request.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="manager" className="space-y-4 mt-4">
            {managerRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending manager requests
              </div>
            ) : (
              managerRequests.map((request) => {
                const managerName =
                  request.manager?.display_name ||
                  `${request.manager?.first_name || ''} ${request.manager?.last_name || ''}`.trim() ||
                  request.manager?.email ||
                  'Unknown Manager';

                const clientName = request.client?.name || 'Unknown Client';

                return (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{managerName}</span>
                            {request.manager_types && request.manager_types.length > 0 && (
                              <Badge className="professional-button">
                                {request.manager_types.join(', ').replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Wants to manage <strong>{clientName}</strong>
                            {request.client?.type && (
                              <span className="capitalize"> ({request.client.type})</span>
                            )}
                          </div>
                          {request.message && (
                            <div className="text-sm bg-muted p-3 rounded-md mt-2">
                              <p className="italic">"{request.message}"</p>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {formatDate(request.created_at)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="professional-button"
                            onClick={() => handleRejectManagerRequest(request.id)}
                            disabled={processingId === request.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveManagerRequest(request.id)}
                            disabled={processingId === request.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
