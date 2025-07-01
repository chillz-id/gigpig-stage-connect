
import React, { useState } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceManagementCard } from './invoice/InvoiceManagementCard';
import { InvoiceDetails } from './InvoiceDetails';
import { useNavigate } from 'react-router-dom';
import { Invoice } from '@/types/invoice';

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
        invoice={selectedInvoice}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
};
