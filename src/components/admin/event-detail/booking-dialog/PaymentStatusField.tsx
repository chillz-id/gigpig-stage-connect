
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentStatusFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const PaymentStatusField: React.FC<PaymentStatusFieldProps> = ({ value, onChange }) => {
  return (
    <div>
      <Label htmlFor="payment_status" className="text-white">Payment Status</Label>
      <Select value={value} onValueChange={onChange}>
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
  );
};

export default PaymentStatusField;
