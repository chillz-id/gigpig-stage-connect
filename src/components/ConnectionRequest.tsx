
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, UserCheck, UserX, Shield, AlertTriangle } from 'lucide-react';

interface ConnectionRequestProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar: string;
  recipientRole: 'comedian' | 'promoter';
  onSendRequest: (message: string) => void;
  onCancel: () => void;
}

const ConnectionRequest: React.FC<ConnectionRequestProps> = ({
  recipientName,
  recipientAvatar,
  recipientRole,
  onSendRequest,
  onCancel
}) => {
  const [introMessage, setIntroMessage] = useState('');

  const handleSendRequest = () => {
    if (introMessage.trim()) {
      onSendRequest(introMessage.trim());
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={recipientAvatar} alt={recipientName} />
            <AvatarFallback>{recipientName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>Connect with {recipientName}</span>
              <Badge 
                variant="outline" 
                className={recipientRole === 'comedian' ? 'text-blue-300 border-blue-300' : 'text-orange-300 border-orange-300'}
              >
                {recipientRole}
              </Badge>
            </CardTitle>
            <CardDescription className="text-purple-200">
              Send a brief introduction to start messaging
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Hi! I'd like to connect with you. I'm a comedian looking for performance opportunities..."
          value={introMessage}
          onChange={(e) => setIntroMessage(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 min-h-[100px]"
          maxLength={500}
        />
        <div className="text-xs text-purple-300 text-right">
          {introMessage.length}/500 characters
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={handleSendRequest}
            disabled={!introMessage.trim()}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Connection Request
          </Button>
          <Button 
            onClick={onCancel}
            variant="outline" 
            className="text-white border-white/30 hover:bg-white/10"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionRequest;
