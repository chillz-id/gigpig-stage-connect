
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BookingFormFieldsProps {
  formData: {
    set_duration: number;
    currency: string;
    payment_type: 'fixed' | 'percentage_revenue' | 'percentage_door';
    performance_fee: number;
    percentage_amount: number;
  };
  onFormDataChange: (updates: Partial<BookingFormFieldsProps['formData']>) => void;
}

const BookingFormFields: React.FC<BookingFormFieldsProps> = ({ formData, onFormDataChange }) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="set_duration" className="text-white">Set Duration (minutes)</Label>
          <Input
            id="set_duration"
            type="number"
            value={formData.set_duration}
            onChange={(e) => onFormDataChange({ set_duration: parseInt(e.target.value) || 0 })}
            className="bg-white/10 border-white/20 text-white"
            min="1"
            max="60"
          />
        </div>
        
        <div>
          <Label htmlFor="currency" className="text-white">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => onFormDataChange({ currency: value })}>
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
        <Select value={formData.payment_type} onValueChange={(value) => onFormDataChange({ payment_type: value as any })}>
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
            onChange={(e) => onFormDataChange({ performance_fee: parseFloat(e.target.value) || 0 })}
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
            onChange={(e) => onFormDataChange({ percentage_amount: parseFloat(e.target.value) || 0 })}
            className="bg-white/10 border-white/20 text-white"
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g., 20"
          />
        </div>
      )}
    </>
  );
};

export default BookingFormFields;
