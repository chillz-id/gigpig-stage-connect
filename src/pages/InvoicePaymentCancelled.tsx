import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const InvoicePaymentCancelled: React.FC = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
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
  };

  const handleRetryPayment = async () => {
    if (!invoice) return;

    try {
      // Get the active payment link
      const { data: paymentLink } = await supabase
        .from('invoice_payment_links')
        .select('url')
        .eq('invoice_id', invoiceId)
        .eq('status', 'active')
        .single();

      if (paymentLink?.url) {
        window.location.href = paymentLink.url;
      } else {
        // If no active link, redirect to invoice page
        navigate(`/invoices/${invoiceId}`);
      }
    } catch (error) {
      console.error('Failed to get payment link:', error);
      navigate(`/invoices/${invoiceId}`);
    }
  };

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
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold text-gray-800">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p>Your payment was cancelled.</p>
            <p className="mt-2">No charges have been made to your account.</p>
            
            {invoice && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                <h3 className="font-semibold mb-2">Invoice Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Invoice Number:</span> {invoice.invoice_number}</p>
                  <p><span className="font-medium">Amount:</span> {invoice.currency} {invoice.total_amount}</p>
                  <p><span className="font-medium">Status:</span> {invoice.status}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={handleRetryPayment}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
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
            <p>If you continue to experience issues, please contact support.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};