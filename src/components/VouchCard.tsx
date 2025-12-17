
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { MessageSquare, Crown, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface OrganizationInfo {
  id: string;
  display_name: string;
  logo_url?: string | null;
}

interface VouchCardProps {
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
    organization?: OrganizationInfo | null;
  };
}

export const VouchCard: React.FC<VouchCardProps> = ({ vouch }) => {
  const otherUser = vouch.type === 'received' ? vouch.fromUser : vouch.toUser;
  const isOrgVouch = !!vouch.organization;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM do yy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar - show org logo if org vouch, otherwise user avatar */}
          <OptimizedAvatar
            src={isOrgVouch ? (vouch.organization?.logo_url || undefined) : otherUser?.avatar}
            name={isOrgVouch ? (vouch.organization?.display_name || 'Org') : (otherUser?.name || '?')}
            className="h-10 w-10"
            fallbackClassName="bg-primary text-primary-foreground"
            fallbackIcon={isOrgVouch ? <Building2 className="w-5 h-5" /> : undefined}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isOrgVouch ? (
                <>
                  <p className="font-medium">{vouch.organization?.display_name}</p>
                  <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </>
              ) : (
                <>
                  <p className="font-medium">{otherUser?.name}</p>
                  <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </>
              )}
            </div>
            {/* Show context underneath org name for org vouches */}
            {isOrgVouch && (
              <p className="text-xs text-muted-foreground mb-2">
                {vouch.type === 'received'
                  ? `via ${vouch.fromUser.name}`
                  : `vouching for ${vouch.toUser?.name || 'Unknown'}`
                }
              </p>
            )}
            <div className="flex items-start gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground flex-1">{vouch.comment}</p>
            </div>
            <p className="text-xs text-muted-foreground">{formatDate(vouch.date)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
