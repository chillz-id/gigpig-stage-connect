import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { toast } from '@/hooks/use-toast';
import { format, isThisMonth, isLastMonth, isThisQuarter, isThisYear, isBefore } from 'date-fns';
import { Link } from 'react-router-dom';
import InvoiceFilters from './InvoiceFilters';

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  currency: string;
  invoice_recipients: Array<{
    recipient_name: string;
    recipient_email: string;
  }>;
}

const InvoiceList: React.FC = () => {
  const { user } = useUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          issue_date,
          due_date,
          status,
          total_amount,
          currency,
          invoice_recipients (
            recipient_name,
            recipient_email
          )
        `)
        .eq('promoter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      toast({
        title: "Success",
        description: "Invoice deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'paid': return 'bg-green-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  const matchesDateFilter = (invoice: Invoice) => {
    if (dateFilter === 'all') return true;
    
    const issueDate = new Date(invoice.issue_date);
    const dueDate = new Date(invoice.due_date);
    
    switch (dateFilter) {
      case 'this-month':
        return isThisMonth(issueDate);
      case 'last-month':
        return isLastMonth(issueDate);
      case 'this-quarter':
        return isThisQuarter(issueDate);
      case 'this-year':
        return isThisYear(issueDate);
      case 'overdue':
        return isBefore(dueDate, new Date()) && invoice.status !== 'paid';
      default:
        return true;
    }
  };

  const matchesAmountFilter = (invoice: Invoice) => {
    if (amountFilter === 'all') return true;
    
    const amount = invoice.total_amount;
    
    switch (amountFilter) {
      case '0-100':
        return amount >= 0 && amount <= 100;
      case '100-500':
        return amount > 100 && amount <= 500;
      case '500-1000':
        return amount > 500 && amount <= 1000;
      case '1000+':
        return amount > 1000;
      default:
        return true;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_recipients.some(recipient => 
        recipient.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipient.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus && matchesDateFilter(invoice) && matchesAmountFilter(invoice);
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setAmountFilter('all');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Invoices</h2>
        <Link to="/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Enhanced Filters */}
      <InvoiceFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        amountFilter={amountFilter}
        setAmountFilter={setAmountFilter}
        onClearFilters={clearFilters}
      />

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              {invoices.length === 0 ? 'No invoices created yet' : 'No invoices match your search'}
            </div>
            <Link to="/invoices/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{invoice.invoice_number}</h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        To: {invoice.invoice_recipients[0]?.recipient_name} ({invoice.invoice_recipients[0]?.recipient_email})
                      </div>
                      <div>
                        Issue Date: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                      </div>
                      <div>
                        Due Date: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-3">
                    <div className="text-2xl font-bold">
                      {invoice.currency} {invoice.total_amount.toFixed(2)}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteInvoice(invoice.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
