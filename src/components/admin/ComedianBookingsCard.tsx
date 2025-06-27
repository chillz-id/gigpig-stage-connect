
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface ComedianBooking {
  id: string;
  event_id: string;
  comedian_id: string;
  performance_fee: number;
  payment_status: string;
  set_duration: number;
}

interface ComedianBookingsCardProps {
  comedianBookings: ComedianBooking[];
}

const ComedianBookingsCard = ({ comedianBookings }: ComedianBookingsCardProps) => {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Comedian Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comedianBookings.length > 0 ? (
            comedianBookings.map((booking) => (
              <div key={booking.id} className="p-3 bg-white/5 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">Comedian ID: {booking.comedian_id}</p>
                    <p className="text-sm text-gray-300">{booking.set_duration} minutes</p>
                    <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {booking.payment_status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-white">${booking.performance_fee}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-300 text-center py-4">No comedian bookings yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianBookingsCard;
