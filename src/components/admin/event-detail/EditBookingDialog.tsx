
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  const calculatePreviewAmount = () => {
    if (formData.payment_type === 'fixed') {
      return formData.performance_fee;
    } else if (formData.payment_type === 'percentage_revenue') {
      return eventRevenue * formData.percentage_amount / 100;
    } else if (formData.payment_type === 'percentage_door') {
      return eventRevenue * formData.percentage_amount / 100;
    }
    return formData.performance_fee;
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="set_duration" className="text-white">Set Duration (minutes)</Label>
              <Input
                id="set_duration"
                type="number"
                value={formData.set_duration}
                onChange={(e) => setFormData(prev => ({ ...prev, set_duration: parseInt(e.target.value) || 0 }))}
                className="bg-white/10 border-white/20 text-white"
                min="1"
                max="60"
              />
            </div>
            
            <div>
              <Label htmlFor="currency" className="text-white">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="payment_type" className="text-white">Payment Type</Label>
            <Select value={formData.payment_type} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_type: value as any }))}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
                <SelectItem value="percentage_revenue">Percentage of Total Revenue</SelectItem>
                <SelectItem value="percentage_door">Percentage of Door Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.payment_type === 'fixed' ? (
            <div>
              <Label htmlFor="performance_fee" className="text-white">Performance Fee</Label>
              <Input
                id="performance_fee"
                type="number"
                value={formData.performance_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, performance_fee: parseFloat(e.target.value) || 0 }))}
                className="bg-white/10 border-white/20 text-white"
                min="0"
                step="0.01"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="percentage_amount" className="text-white">
                Percentage {formData.payment_type === 'percentage_revenue' ? 'of Revenue' : 'of Door Sales'}
              </Label>
              <Input
                id="percentage_amount"
                type="number"
                value={formData.percentage_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, percentage_amount: parseFloat(e.target.value) || 0 }))}
                className="bg-white/10 border-white/20 text-white"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g., 20"
              />
            </div>
          )}

          <div className="bg-white/5 p-3 rounded-lg">
            <div className="text-white/60 text-sm">Preview Payment Amount:</div>
            <div className="text-lg font-semibold text-white">
              ${calculatePreviewAmount().toFixed(2)} {formData.currency}
            </div>
            {formData.payment_type !== 'fixed' && (
              <div className="text-xs text-white/50 mt-1">
                Based on current event revenue: ${eventRevenue.toFixed(2)}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="payment_status" className="text-white">Payment Status</Label>
            <Select value={formData.payment_status} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="performance_notes" className="text-white">Performance Notes</Label>
            <Textarea
              id="performance_notes"
              value={formData.performance_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, performance_notes: e.target.value }))}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              placeholder="Any special notes about this performance..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-white hover:bg-white/10"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;
