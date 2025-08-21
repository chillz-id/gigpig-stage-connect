
import React, { useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import EditBookingDialog from './EditBookingDialog';
import LineupSummaryCards from './LineupSummaryCards';
import LineupControls from './LineupControls';
import LineupTable from './LineupTable';
import { useLineupData } from '@/hooks/useLineupData';
import { useLineupActions } from '@/hooks/useLineupActions';

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

interface EventLineupTabProps {
  eventId: string;
}

const EventLineupTab: React.FC<EventLineupTabProps> = ({ eventId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBooking, setEditingBooking] = useState<ComedianBooking | null>(null);
  const [isProcessingInvoices, setIsProcessingInvoices] = useState(false);

  const {
    loading,
    bookings,
    setBookings,
    totalFees,
    selectedBookings,
    setSelectedBookings,
    eventRevenue,
    fetchLineupData,
  } = useLineupData(eventId);

  const {
    handleSelectBooking,
    handleSelectAll,
    handleCreateInvoices: originalHandleCreateInvoices,
    handleDeleteBooking,
    updatePaymentStatus,
  } = useLineupActions(
    eventId,
    bookings,
    setBookings,
    selectedBookings,
    setSelectedBookings,
    eventRevenue,
    fetchLineupData
  );

  const handleCreateInvoices = async () => {
    setIsProcessingInvoices(true);
    try {
      await originalHandleCreateInvoices();
    } finally {
      setIsProcessingInvoices(false);
    }
  };

  const calculateBookingAmount = (booking: ComedianBooking) => {
    if (booking.payment_type === 'fixed') {
      return booking.performance_fee;
    } else if (booking.payment_type === 'percentage_revenue') {
      return eventRevenue * booking.percentage_amount / 100;
    } else if (booking.payment_type === 'percentage_door') {
      return eventRevenue * booking.percentage_amount / 100;
    }
    return booking.performance_fee;
  };

  const selectedTotal = selectedBookings.reduce((total, bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    return booking ? total + calculateBookingAmount(booking) : total;
  }, 0);

  const filteredBookings = bookings.filter(booking =>
    booking.comedian_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.comedian_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LineupSummaryCards
        totalComedians={bookings.length}
        totalFees={totalFees}
        selectedCount={selectedBookings.length}
        selectedTotal={selectedTotal}
        eventRevenue={eventRevenue}
      />

      <LineupControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCount={selectedBookings.length}
        totalCount={bookings.length}
        onSelectAll={handleSelectAll}
        onCreateInvoices={handleCreateInvoices}
        isProcessingInvoices={isProcessingInvoices}
      />

      <LineupTable
        bookings={filteredBookings}
        selectedBookings={selectedBookings}
        eventRevenue={eventRevenue}
        onSelectBooking={handleSelectBooking}
        onSelectAll={handleSelectAll}
        onEditBooking={setEditingBooking}
        onDeleteBooking={handleDeleteBooking}
        onUpdatePaymentStatus={updatePaymentStatus}
      />

      {editingBooking && (
        <EditBookingDialog
          booking={editingBooking}
          eventRevenue={eventRevenue}
          onClose={() => setEditingBooking(null)}
          onSave={fetchLineupData}
        />
      )}
    </div>
  );
};

export default EventLineupTab;
