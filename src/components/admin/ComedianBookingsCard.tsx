
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Drama } from 'lucide-react';

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
        <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
          <Drama className="w-5 h-5 flex-shrink-0" />
          Comedian Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comedianBookings.length > 0 ? (
            comedianBookings.map((booking) => (
              <div key={booking.id} className="p-3 bg-white/5 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm md:text-base">Comedian ID: {booking.comedian_id}</p>
                    <p className="text-sm text-gray-300">{booking.set_duration} minutes</p>
                    <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                      {booking.payment_status}
                    </Badge>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-white font-medium">${booking.performance_fee}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Drama className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-300" />
              <p className="text-gray-300 text-content">No comedian bookings yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianBookingsCard;
