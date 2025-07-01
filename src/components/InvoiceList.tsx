
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import InvoiceFilters from './InvoiceFilters';
import { InvoiceCard } from './invoice/InvoiceCard';
import { InvoiceEmptyState } from './invoice/InvoiceEmptyState';
import { InvoiceLoadingState } from './invoice/InvoiceLoadingState';
import { useInvoices } from '@/hooks/useInvoices';
import { DateFilter, AmountRange, DEFAULT_AMOUNT_RANGE } from '@/types/invoice';

const InvoiceList: React.FC = () => {
  const { user } = useUser();
  const { invoices, loading, deleteInvoice, filterInvoices } = useInvoices();
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

  if (loading) {
    return <InvoiceLoadingState />;
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
