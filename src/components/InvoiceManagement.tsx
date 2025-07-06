
import React, { useState } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceDetails } from './InvoiceDetails';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice, DateFilter, AmountRange, DEFAULT_AMOUNT_RANGE } from '@/types/invoice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus } from 'lucide-react';
import InvoiceFilters from './InvoiceFilters';
import { InvoiceCard } from './invoice/InvoiceCard';
import { InvoiceEmptyState } from './invoice/InvoiceEmptyState';
import { InvoiceLoadingState } from './invoice/InvoiceLoadingState';

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
  const { invoices, loading, error, deleteInvoice, filterInvoices } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filter states - full feature set
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [amountRange, setAmountRange] = useState<AmountRange>(DEFAULT_AMOUNT_RANGE);

  const filteredInvoices = filterInvoices(searchTerm, statusFilter, dateFilter, amountRange);

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetails(true);
  };

  const handleCreateNew = () => {
    // Navigate to invoice creation form
    window.location.href = '/invoices/new';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setAmountRange(DEFAULT_AMOUNT_RANGE);
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

  if (loading) {
    return <InvoiceLoadingState />;
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Invoice Management</h2>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Invoices</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Invoice Management</h2>
        <Button onClick={handleCreateNew} className="w-full sm:w-auto h-12 text-base">
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <InvoiceFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        amountRange={amountRange}
        setAmountRange={setAmountRange}
        onClearFilters={clearFilters}
      />

      {filteredInvoices.length === 0 ? (
        <InvoiceEmptyState hasInvoices={invoices.length > 0} onCreateClick={handleCreateNew} />
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onDelete={deleteInvoice}
              onView={() => handleViewDetails(invoice)}
            />
          ))}
        </div>
      )}

      <InvoiceDetails
        invoice={selectedInvoice ? transformInvoiceForDetails(selectedInvoice) : null}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </div>
  );
};
