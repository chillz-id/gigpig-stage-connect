
import React from 'react';

interface PaymentPreviewProps {
  formData: {
    payment_type: 'fixed' | 'percentage_revenue' | 'percentage_door';
    performance_fee: number;
    percentage_amount: number;
    currency: string;
  };
  eventRevenue: number;
}

const PaymentPreview: React.FC<PaymentPreviewProps> = ({ formData, eventRevenue }) => {
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
  );
};

export default PaymentPreview;
