
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, User, Drama } from 'lucide-react';

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
  const totalFees = comedianBookings.reduce((sum, booking) => sum + booking.performance_fee, 0);
  const totalDuration = comedianBookings.reduce((sum, booking) => sum + booking.set_duration, 0);

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Drama className="w-5 h-5" />
          Comedian Bookings ({comedianBookings.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <DollarSign className="w-4 h-4" />
              Total Fees
            </div>
            <div className="text-xl font-bold text-white">
              ${totalFees.toFixed(2)}
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Clock className="w-4 h-4" />
              Total Duration
            </div>
            <div className="text-xl font-bold text-white">
              {totalDuration} min
            </div>
          </div>
        </div>

        {comedianBookings.length > 0 ? (
          <div className="rounded-lg border border-white/20 bg-white/5 max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/20">
                  <TableHead className="text-gray-300">Comedian</TableHead>
                  <TableHead className="text-gray-300">Fee</TableHead>
                  <TableHead className="text-gray-300">Duration</TableHead>
                  <TableHead className="text-gray-300">Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comedianBookings.map((booking) => (
                  <TableRow key={booking.id} className="border-white/20">
                    <TableCell className="text-white">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {booking.comedian_id.substring(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {booking.performance_fee.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {booking.set_duration} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentStatusVariant(booking.payment_status)}>
                        {booking.payment_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-300">
            <Drama className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No comedian bookings for this event.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComedianBookingsCard;
