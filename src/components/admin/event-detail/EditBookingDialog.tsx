
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BookingFormFields from './booking-dialog/BookingFormFields';
import PaymentPreview from './booking-dialog/PaymentPreview';
import PaymentStatusField from './booking-dialog/PaymentStatusField';
import PerformanceNotesField from './booking-dialog/PerformanceNotesField';
import BookingDialogActions from './booking-dialog/BookingDialogActions';

interface ComedianBooking {
  id: string;
  comedian_id: string;
  performance_fee: number;
  payment_status: string;
  set_duration: number;
  performance_notes?: string;
  currency: string;
  payment_type: 'fixed' | 'percentage_revenue' | 'percentage_door';
  percentage_amount: number;
  is_editable: boolean;
  comedian_name?: string;
  comedian_email?: string;
}

interface EditBookingDialogProps {
  booking: ComedianBooking;
  eventRevenue: number;
  onClose: () => void;
  onSave: () => void;
}

const EditBookingDialog: React.FC<EditBookingDialogProps> = ({ 
  booking, 
  eventRevenue, 
  onClose, 
  onSave 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    performance_fee: booking.performance_fee,
    set_duration: booking.set_duration || 5,
    performance_notes: booking.performance_notes || '',
    currency: booking.currency,
    payment_type: booking.payment_type,
    percentage_amount: booking.percentage_amount,
    payment_status: booking.payment_status,
  });

  const handleFormDataChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('comedian_bookings')
        .update({
          performance_fee: formData.performance_fee,
          set_duration: formData.set_duration,
          performance_notes: formData.performance_notes,
          currency: formData.currency,
          payment_type: formData.payment_type,
          percentage_amount: formData.percentage_amount,
          payment_status: formData.payment_status,
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Booking Updated",
        description: "Comedian booking has been updated successfully",
      });

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            Edit Booking - {booking.comedian_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <BookingFormFields 
            formData={formData} 
            onFormDataChange={handleFormDataChange} 
          />

          <PaymentPreview 
            formData={formData} 
            eventRevenue={eventRevenue} 
          />

          <PaymentStatusField
            value={formData.payment_status}
            onChange={(value) => handleFormDataChange({ payment_status: value })}
          />

          <PerformanceNotesField
            value={formData.performance_notes}
            onChange={(value) => handleFormDataChange({ performance_notes: value })}
          />
        </div>

        <BookingDialogActions
          loading={loading}
          onCancel={onClose}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;
