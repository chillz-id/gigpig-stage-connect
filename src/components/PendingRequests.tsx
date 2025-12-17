
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { UserCheck, UserX, Shield } from 'lucide-react';

interface ConnectionRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: 'comedian' | 'promoter';
  message: string;
  timestamp: string;
}

interface PendingRequestsProps {
  requests: ConnectionRequest[];
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onBlockUser: (userId: string) => void;
}

const PendingRequests: React.FC<PendingRequestsProps> = ({
  requests,
  onAcceptRequest,
  onDeclineRequest,
  onBlockUser
}) => {
  if (requests.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-8 text-center">
          <UserCheck className="w-12 h-12 mx-auto mb-4 text-purple-300" />
          <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
          <p className="text-purple-200">You're all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between space-x-4">
              <div className="flex items-start space-x-3 flex-1">
                <OptimizedAvatar
                  src={request.senderAvatar}
                  name={request.senderName}
                  className="w-12 h-12"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium">{request.senderName}</h4>
                    <Badge 
                      className="professional-button" 
                      className={request.senderRole === 'comedian' ? 'text-blue-300 border-blue-300' : 'text-orange-300 border-orange-300'}
                    >
                      {request.senderRole}
                    </Badge>
                    <span className="text-xs text-purple-300">{request.timestamp}</span>
                  </div>
                  <p className="text-sm text-purple-100 mb-3">{request.message}</p>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm"
                      onClick={() => onAcceptRequest(request.id)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      size="sm"
                      className="professional-button"
                      onClick={() => onDeclineRequest(request.id)}
                      className="text-white border-white/30 hover:bg-white/10"
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                    <Button 
                      size="sm"
                      className="professional-button"
                      onClick={() => onBlockUser(request.senderId)}
                      className="text-red-300 border-red-300 hover:bg-red-500/20"
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Block
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PendingRequests;
