
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import InvoiceFilters from './InvoiceFilters';
import { InvoiceCard } from './invoice/InvoiceCard';
import { InvoiceEmptyState } from './invoice/InvoiceEmptyState';
import { InvoiceLoadingState } from './invoice/InvoiceLoadingState';
import { useInvoices } from '@/hooks/useInvoices';
import { DateFilter, AmountRange, DEFAULT_AMOUNT_RANGE } from '@/types/invoice';
import { Card, CardContent } from '@/components/ui/card';

const InvoiceList: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { invoices, loading, error, deleteInvoice, filterInvoices } = useInvoices();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [amountRange, setAmountRange] = useState<AmountRange>(DEFAULT_AMOUNT_RANGE);

  const filteredInvoices = filterInvoices(searchTerm, statusFilter, dateFilter, amountRange);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setAmountRange(DEFAULT_AMOUNT_RANGE);
  };

  // Show access denied for users without invoice access
  if (!user || (!hasRole('promoter') && !hasRole('comedian') && !hasRole('admin'))) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold">Invoices</h2>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-600" />
            <h3 className="text-xl font-semibold text-amber-800 mb-2">Access Required</h3>
            <p className="text-amber-700">
              You need promoter, comedian, or admin access to manage invoices.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <InvoiceLoadingState />;
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold">Invoices</h2>
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
        <h2 className="text-2xl sm:text-3xl font-bold">Invoices</h2>
        <Link to="/invoices/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-12 text-base">
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
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
        <InvoiceEmptyState hasInvoices={invoices.length > 0} />
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onDelete={deleteInvoice}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
