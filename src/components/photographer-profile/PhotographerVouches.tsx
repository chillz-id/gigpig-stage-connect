import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Award, TrendingUp } from 'lucide-react';
import { PhotographerVouch, PhotographerVouchStats } from '@/types/photographer';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import VouchButton from '@/components/VouchButton';

interface PhotographerVouchesProps {
  vouches: PhotographerVouch[];
  photographerId: string;
  stats: PhotographerVouchStats | null;
}

const PhotographerVouches: React.FC<PhotographerVouchesProps> = ({
  vouches,
  photographerId,
  stats
}) => {
  const { user } = useAuth();

  const ratingDistribution = React.useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    vouches.forEach(vouch => {
      if (vouch.rating) {
        dist[vouch.rating as keyof typeof dist]++;
      }
    });
    return dist;
  }, [vouches]);

  if (vouches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No vouches yet</p>
            <p className="text-sm text-gray-400 mb-6">
              Be the first to vouch for this photographer's work
            </p>
            {user && (
              <VouchButton
                profileId={photographerId}
                profileName="this photographer"
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Vouch Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-8">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold">
                {stats?.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
              </div>
              <div className="flex items-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(stats?.average_rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {stats?.total_vouches || 0} vouches from {stats?.unique_vouchers || 0} people
              </p>
            </div>

            {/* Distribution */}
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                const percentage = vouches.length > 0 ? (count / vouches.length) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-2 mb-1">
                    <span className="text-sm w-3">{rating}</span>
                    <Star className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          {stats?.recent_vouches && stats.recent_vouches > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                {stats.recent_vouches} vouches in the last 6 months
              </span>
            </div>
          )}

          {/* Add Vouch Button */}
          {user && (
            <div className="mt-6">
              <VouchButton
                profileId={photographerId}
                profileName="this photographer"
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vouches List */}
      <div className="space-y-4">
        {vouches.map(vouch => (
          <Card key={vouch.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Voucher Avatar */}
                <Avatar>
                  <AvatarImage 
                    src={vouch.voucher_avatar_url || ''} 
                    alt={vouch.voucher_name || ''} 
                  />
                  <AvatarFallback>
                    {vouch.voucher_name?.charAt(0) || 'V'}
                  </AvatarFallback>
                </Avatar>

                {/* Vouch Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{vouch.voucher_name || 'Anonymous'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {vouch.rating && (
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < vouch.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <span className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(vouch.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {vouch.voucher_role && (
                      <Badge variant="secondary">
                        {vouch.voucher_role.charAt(0).toUpperCase() + vouch.voucher_role.slice(1)}
                      </Badge>
                    )}
                  </div>

                  {/* Relationship */}
                  {vouch.relationship && (
                    <p className="text-sm text-gray-600 mt-2">
                      Relationship: {vouch.relationship}
                    </p>
                  )}

                  {/* Vouch Message */}
                  {vouch.message && (
                    <p className="mt-3 text-gray-700">{vouch.message}</p>
                  )}

                  {/* Event Info */}
                  {vouch.event_title && (
                    <p className="text-sm text-gray-500 mt-2">
                      Event: {vouch.event_title}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PhotographerVouches;