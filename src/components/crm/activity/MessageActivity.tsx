import { Badge } from '@/components/ui/badge';
import { Mail, User } from 'lucide-react';
import type { CustomerActivity } from '@/hooks/useCustomerActivity';

interface MessageActivityProps {
  metadata: CustomerActivity['metadata'];
}

export const MessageActivity = ({ metadata }: MessageActivityProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <h4 className="font-semibold">Message</h4>
      {metadata.is_read ? (
        <Badge className="professional-button text-xs">
          Read
        </Badge>
      ) : (
        <Badge variant="default" className="text-xs">
          Unread
        </Badge>
      )}
    </div>
    <div className="space-y-1 text-sm text-muted-foreground">
      {metadata.subject && (
        <div className="flex items-center gap-2">
          <Mail className="h-3 w-3" />
          <span className="font-medium">{metadata.subject}</span>
        </div>
      )}
      {metadata.sender_name && (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3" />
          <span>From: {metadata.sender_name}</span>
        </div>
      )}
    </div>
  </div>
);
