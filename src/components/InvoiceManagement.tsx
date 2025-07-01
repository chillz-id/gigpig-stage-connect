
import React, { useState } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceManagementCard } from './invoice/InvoiceManagementCard';
import { InvoiceDetails } from './InvoiceDetails';
import { useNavigate } from 'react-router-dom';
import { Invoice } from '@/types/invoice';

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
  const { invoices, loading } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetails(true);
  };

  const handleCreateNew = () => {
    navigate('/invoices/new');
  };

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
