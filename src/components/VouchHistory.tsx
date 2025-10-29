import { useMemo } from 'react';
import { Crown, Users } from 'lucide-react';
import { VouchCard } from './VouchCard';
import { useVouches } from '@/hooks/useVouches';
import { useAuth } from '@/contexts/AuthContext';

interface VouchHistoryProps {
  userId: string;
  mode: 'received' | 'given';
}

export function VouchHistory({ userId, mode }: VouchHistoryProps) {
  const { user } = useAuth();
  const {
    loading,
    getReceivedVouches,
    getGivenVouches
  } = useVouches();

  const vouches = useMemo(() => {
    return mode === 'received' ? getReceivedVouches() : getGivenVouches();
  }, [mode, getReceivedVouches, getGivenVouches]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading vouches...</p>
      </div>
    );
  }

  if (vouches.length === 0) {
    return (
      <div className="text-center py-8">
        {mode === 'received' ? (
          <>
            <Crown className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No vouches received yet.</p>
          </>
        ) : (
          <>
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No vouches given yet.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vouches.map((vouch) => (
        <VouchCard
          key={vouch.id}
          vouch={mode === 'received' ? {
            id: vouch.id,
            fromUser: {
              name: vouch.voucher_profile?.stage_name || vouch.voucher_profile?.name || 'Unknown User',
              avatar: vouch.voucher_profile?.avatar_url || '',
              role: 'User'
            },
            rating: vouch.rating,
            comment: vouch.message,
            date: vouch.created_at,
            type: 'received' as const
          } : {
            id: vouch.id,
            fromUser: {
              name: user?.name || 'You',
              avatar: '',
              role: 'You'
            },
            toUser: {
              name: vouch.vouchee_profile?.stage_name || vouch.vouchee_profile?.name || 'Unknown User',
              avatar: vouch.vouchee_profile?.avatar_url || '',
              role: 'User'
            },
            rating: vouch.rating,
            comment: vouch.message,
            date: vouch.created_at,
            type: 'given' as const
          }}
        />
      ))}
    </div>
  );
}
