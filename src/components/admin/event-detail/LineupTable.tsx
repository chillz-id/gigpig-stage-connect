
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Edit, Trash2 } from 'lucide-react';

interface ComedianBooking {
  id: string;
  comedian_id: string;
  performance_fee: number;
  payment_status: string;
  set_duration: number;
  performance_notes?: string;
  currency: string;
  created_at: string;
  is_selected: boolean;
  payment_type: 'fixed' | 'percentage_revenue' | 'percentage_door';
  percentage_amount: number;
  is_editable: boolean;
  comedian_name?: string;
  comedian_email?: string;
}

interface LineupTableProps {
  bookings: ComedianBooking[];
  selectedBookings: string[];
  eventRevenue: number;
  onSelectBooking: (bookingId: string, isSelected: boolean) => void;
  onSelectAll: () => void;
  onEditBooking: (booking: ComedianBooking) => void;
  onDeleteBooking: (bookingId: string) => void;
  onUpdatePaymentStatus: (bookingId: string, status: string) => void;
}

const LineupTable: React.FC<LineupTableProps> = ({
  bookings,
  selectedBookings,
  eventRevenue,
  onSelectBooking,
  onSelectAll,
  onEditBooking,
  onDeleteBooking,
  onUpdatePaymentStatus,
}) => {
  const getPaymentDisplayText = (booking: ComedianBooking) => {
    if (booking.payment_type === 'fixed') {
      return `$${Number(booking.performance_fee).toFixed(2)} ${booking.currency}`;
    } else if (booking.payment_type === 'percentage_revenue') {
      const amount = eventRevenue * booking.percentage_amount / 100;
      return `${booking.percentage_amount}% of revenue ($${amount.toFixed(2)})`;
    } else if (booking.payment_type === 'percentage_door') {
      const amount = eventRevenue * booking.percentage_amount / 100;
      return `${booking.percentage_amount}% of door ($${amount.toFixed(2)})`;
    }
    return `$${Number(booking.performance_fee).toFixed(2)} ${booking.currency}`;
  };

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Event Lineup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left text-white/80 font-medium p-3 w-12">
                  <Checkbox
                    checked={selectedBookings.length === bookings.length && bookings.length > 0}
                    onCheckedChange={onSelectAll}
                    className="border-white/40"
                  />
                </th>
                <th className="text-left text-white/80 font-medium p-3">Comedian</th>
                <th className="text-left text-white/80 font-medium p-3">Contact</th>
                <th className="text-left text-white/80 font-medium p-3">Set Duration</th>
                <th className="text-left text-white/80 font-medium p-3">Performance Fee</th>
                <th className="text-left text-white/80 font-medium p-3">Payment Status</th>
                <th className="text-left text-white/80 font-medium p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="text-white p-3">
                    <Checkbox
                      checked={selectedBookings.includes(booking.id)}
                      onCheckedChange={(checked) => onSelectBooking(booking.id, !!checked)}
                      className="border-white/40"
                    />
                  </td>
                  <td className="text-white p-3">
                    <div>
                      <div className="font-medium">{booking.comedian_name}</div>
                      {booking.performance_notes && (
                        <div className="text-sm text-white/60 mt-1">
                          {booking.performance_notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-white p-3 text-sm">
                    {booking.comedian_email}
                  </td>
                  <td className="text-white p-3">
                    {booking.set_duration || 'N/A'} minutes
                  </td>
                  <td className="text-white p-3">
                    <div className="text-sm">
                      {getPaymentDisplayText(booking)}
                    </div>
                  </td>
                  <td className="text-white p-3">
                    <select
                      value={booking.payment_status}
                      onChange={(e) => onUpdatePaymentStatus(booking.id, e.target.value)}
                      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                      disabled={!booking.is_editable}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </td>
                  <td className="text-white p-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/10 p-2 h-auto"
                        title="Edit Booking"
                        onClick={() => onEditBooking(booking)}
                        disabled={!booking.is_editable}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => onDeleteBooking(booking.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-400/10 hover:text-red-300 p-2 h-auto"
                        title="Remove from Lineup"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {bookings.length === 0 && (
            <div className="text-center py-8 text-white/60">
              No comedians booked yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LineupTable;
