import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const InvoicePaymentSuccess: React.FC = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadInvoice = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_recipients(*)')
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      setInvoice(data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (invoiceId) {
      void loadInvoice();
    }
  }, [invoiceId, loadInvoice]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold text-green-700">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p>Thank you for your payment.</p>
            {invoice && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                <h3 className="font-semibold mb-2">Invoice Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Invoice Number:</span> {invoice.invoice_number}</p>
                  <p><span className="font-medium">Amount:</span> {invoice.currency} {invoice.total_amount}</p>
                  <p><span className="font-medium">Date:</span> {format(new Date(), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => navigate(`/invoices/${invoiceId}`)}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Invoice
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/invoices')}
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>A confirmation email has been sent to your registered email address.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
