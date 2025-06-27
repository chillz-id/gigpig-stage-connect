
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Drama, Clock, DollarSign, User } from 'lucide-react';

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
  const totalFees = comedianBookings.reduce((sum, booking) => sum + (booking.performance_fee || 0), 0);
  const totalDuration = comedianBookings.reduce((sum, booking) => sum + (booking.set_duration || 0), 0);
  const paidBookings = comedianBookings.filter(booking => booking.payment_status === 'paid').length;

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'overdue': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
          <Drama className="w-5 h-5 flex-shrink-0" />
          Comedian Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {comedianBookings.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white/5 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{comedianBookings.length}</div>
              <div className="text-xs text-gray-300">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">${totalFees.toFixed(2)}</div>
              <div className="text-xs text-gray-300">Total Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{totalDuration}m</div>
              <div className="text-xs text-gray-300">Total Time</div>
            </div>
          </div>
        )}

        {/* Payment Status Summary */}
        {comedianBookings.length > 0 && (
          <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg">
            <div className="text-sm text-gray-300">
              Payment Status: {paidBookings}/{comedianBookings.length} paid
            </div>
            <div className="w-32 bg-white/20 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${comedianBookings.length > 0 ? (paidBookings / comedianBookings.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comedianBookings.length > 0 ? (
            comedianBookings.map((booking) => (
              <div key={booking.id} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="text-white font-medium text-sm md:text-base">
                        Comedian ID: {booking.comedian_id}
                      </p>
                      <Badge variant={getPaymentStatusVariant(booking.payment_status)}>
                        {booking.payment_status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {booking.set_duration || 5} minutes
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span className={getPaymentStatusColor(booking.payment_status)}>
                          ${(booking.performance_fee || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right">
                    <div className="text-white font-medium">
                      ${(booking.performance_fee || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">
                      ${((booking.performance_fee || 0) / (booking.set_duration || 1)).toFixed(2)}/min
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Drama className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-300" />
              <p className="text-gray-300 text-content">No comedian bookings yet</p>
              <p className="text-xs text-gray-400 mt-2">Bookings will appear here once comedians are booked</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianBookingsCard;
