
import React, { useState } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceManagementCard } from './invoice/InvoiceManagementCard';
import { InvoiceDetails } from './InvoiceDetails';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice } from '@/types/invoice';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

// Transform database invoice to match InvoiceDetails component expectations
const transformInvoiceForDetails = (invoice: Invoice) => {
  return {
    id: invoice.id,
    number: invoice.invoice_number,
    clientName: invoice.invoice_recipients.length > 0 ? invoice.invoice_recipients[0].recipient_name : 'No recipient',
    amount: invoice.total_amount,
    dueDate: invoice.due_date,
    createdDate: invoice.issue_date,
    status: invoice.status,
    currency: invoice.currency,
    // Include original invoice data for any additional properties needed
    ...invoice
  };
};

export const InvoiceManagement: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { invoices, loading, error } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  console.log('=== INVOICE MANAGEMENT RENDER ===', {
    user: user?.id,
    hasPromoterRole: hasRole('promoter'),
    hasComedianRole: hasRole('comedian'),
    hasAdminRole: hasRole('admin'),
    loading,
    error,
    invoicesCount: invoices.length
  });

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetails(true);
  };

  const handleCreateNew = () => {
    navigate('/invoices/new');
  };

  // Show authentication error if user doesn't have the right role
  if (!user || (!hasRole('promoter') && !hasRole('comedian') && !hasRole('admin'))) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-600" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Access Required</h3>
          <p className="text-amber-700">
            You need promoter, comedian, or admin access to view invoices.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Invoices</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <InvoiceManagementCard
        invoices={invoices}
        onViewDetails={handleViewDetails}
        onCreateNew={handleCreateNew}
      />

      <InvoiceDetails
        invoice={selectedInvoice ? transformInvoiceForDetails(selectedInvoice) : null}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
};
