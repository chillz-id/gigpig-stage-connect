import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, MessageSquare } from 'lucide-react';

interface VouchCardSimpleProps {
  vouch: {
    id: string;
    fromUser: {
      name: string;
      avatar?: string;
      role: string;
    };
    toUser?: {
      name: string;
      avatar?: string;
      role: string;
    };
    comment: string;
    date: string;
    type: 'received' | 'given';
  };
}

/**
 * VouchCardSimple - Binary Vouch Display Card
 *
 * Displays a vouch with:
 * - Single crown icon (no rating scale)
 * - User info (avatar, name, role)
 * - Optional comment
 * - Date and type badge
 */
export const VouchCardSimple: React.FC<VouchCardSimpleProps> = ({ vouch }) => {
  const otherUser = vouch.type === 'received' ? vouch.fromUser : vouch.toUser;

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {otherUser?.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="font-medium">{otherUser?.name}</p>
                <Badge variant="outline" className="text-xs">
                  {otherUser?.role}
                </Badge>
              </div>
              <Crown className="w-5 h-5 text-yellow-500 fill-current" title="Vouched" />
            </div>
            {vouch.comment && (
              <div className="flex items-start gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground flex-1">{vouch.comment}</p>
              </div>
            )}
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{vouch.date}</p>
              <Badge variant={vouch.type === 'received' ? 'default' : 'secondary'}>
                {vouch.type === 'received' ? 'Received' : 'Given'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
