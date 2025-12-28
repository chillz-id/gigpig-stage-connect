
import React, { useState, useEffect, useMemo } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { useBulkInvoiceOperations } from '@/hooks/useBulkInvoiceOperations';
import { InvoiceDetails } from './InvoiceDetails';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice, DateFilter, AmountRange, DEFAULT_AMOUNT_RANGE } from '@/types/invoice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus, ListChecks } from 'lucide-react';
import InvoiceFilters from './InvoiceFilters';
import { InvoiceCard } from './invoice/InvoiceCard';
import { InvoiceCardWithSelection } from './invoice/InvoiceCardWithSelection';
import { InvoiceEmptyState } from './invoice/InvoiceEmptyState';
import { InvoiceLoadingState } from './invoice/InvoiceLoadingState';
import { InvoiceEdit } from './invoice/InvoiceEdit';
import { BulkActionsBar } from './invoice/BulkActionsBar';

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
  const { user, hasRole, isLoading: authLoading, profile } = useAuth();
  const { invoices, loading, error, deleteInvoice, filterInvoices, refetchInvoices } = useInvoices();
  const bulkOperations = useBulkInvoiceOperations();
  const {
    selectedCount,
    selectedInvoiceIds,
    clearSelection,
    toggleInvoiceSelection
  } = bulkOperations;
  const selectedInvoiceIdsArray = useMemo(() => Array.from(selectedInvoiceIds), [selectedInvoiceIds]);
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Filter states - full feature set
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [amountRange, setAmountRange] = useState<AmountRange>(DEFAULT_AMOUNT_RANGE);

  const filteredInvoices = filterInvoices(searchTerm, statusFilter, dateFilter, amountRange);

  // Update filtered invoice IDs when filters change
  useEffect(() => {
    if (isSelectionMode && selectedCount > 0) {
      // Keep only selected invoices that are still in filtered results
      const filteredIds = new Set(filteredInvoices.map(inv => inv.id));
      const currentSelected = selectedInvoiceIdsArray;
      const validSelections = currentSelected.filter(id => filteredIds.has(id));
      
      if (validSelections.length !== currentSelected.length) {
        clearSelection();
        validSelections.forEach(id => toggleInvoiceSelection(id));
      }
    }
  }, [clearSelection, filteredInvoices, isSelectionMode, selectedCount, selectedInvoiceIdsArray, toggleInvoiceSelection]);

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

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      clearSelection();
    }
  };

  const handleSelectAll = () => {
    if (selectedCount === filteredInvoices.length) {
      clearSelection();
    } else {
      bulkOperations.selectAllInvoices(filteredInvoices.map(inv => inv.id));
    }
  };

  // Bulk operation handlers
  const handleBulkDelete = async () => {
    try {
      await bulkOperations.bulkDeleteDrafts();
      await refetchInvoices();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleBulkStatusUpdate = async (status: any) => {
    try {
      await bulkOperations.bulkUpdateStatus(status);
      await refetchInvoices();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleBulkComplete = async () => {
    await refetchInvoices();
    setIsSelectionMode(false);
  };

  // Wait for profile to load - profile and roles are fetched together
  // This prevents showing "Access Required" error before roles are actually loaded
  const initialDataLoaded = !user || profile !== null;

  // Show loading while auth or initial data is still loading
  if (authLoading || loading || (user && !initialDataLoaded)) {
    return <InvoiceLoadingState />;
  }

  // Show authentication error if user doesn't have the right role (only after profile/roles are loaded)
  if (!user || (!hasRole('comedian') && !hasRole('comedian_lite') && !hasRole('admin'))) {
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
      {/* Bulk actions bar */}
      <BulkActionsBar
        selectedCount={selectedCount}
        isProcessing={bulkOperations.isProcessing}
        progress={bulkOperations.progress}
        onSendEmails={async () => {
          await bulkOperations.bulkSendEmails();
          await handleBulkComplete();
        }}
        onMarkPaid={async () => {
          await bulkOperations.bulkMarkAsPaid();
          await handleBulkComplete();
        }}
        onMarkUnpaid={async () => {
          await bulkOperations.bulkMarkAsUnpaid();
          await handleBulkComplete();
        }}
        onUpdateStatus={handleBulkStatusUpdate}
        onDeleteDrafts={handleBulkDelete}
        onExportCSV={bulkOperations.bulkExportCSV}
        onExportPDF={bulkOperations.bulkExportPDF}
        onClearSelection={clearSelection}
        onCancel={bulkOperations.cancelOperation}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Invoice Management</h2>
        <div className="flex gap-2">
          <Button
            variant={isSelectionMode ? "default" : "secondary"}
            onClick={toggleSelectionMode}
            className="h-12"
          >
            <ListChecks className="w-4 h-4 mr-2" />
            {isSelectionMode ? 'Exit Selection' : 'Select Multiple'}
          </Button>
          <Button onClick={handleCreateNew} className="h-12 text-base">
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
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

      {isSelectionMode && filteredInvoices.length > 0 && (
        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
          <Button
            variant="link"
            size="sm"
            onClick={handleSelectAll}
          >
            {bulkOperations.selectedCount === filteredInvoices.length 
              ? 'Deselect all' 
              : `Select all ${filteredInvoices.length} invoices`}
          </Button>
        </div>
      )}

      {filteredInvoices.length === 0 ? (
        <InvoiceEmptyState hasInvoices={invoices.length > 0} onCreateClick={handleCreateNew} />
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => (
            isSelectionMode ? (
              <InvoiceCardWithSelection
                key={invoice.id}
                invoice={invoice}
                isSelected={bulkOperations.selectedInvoiceIds.has(invoice.id)}
                onSelect={bulkOperations.toggleInvoiceSelection}
                onDelete={deleteInvoice}
                onView={handleViewDetails}
                isSelectionMode={isSelectionMode}
              />
            ) : (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onDelete={deleteInvoice}
                onView={() => handleViewDetails(invoice)}
              />
            )
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
