import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useInvoices } from '@/hooks/useInvoices';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  MoreHorizontal,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Invoice, InvoiceStatus, InvoiceType } from '@/types/invoice';

const STATUS_CONFIG: Record<InvoiceStatus | string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: <FileText className="h-3 w-3" /> },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', icon: <Send className="h-3 w-3" /> },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', icon: <CheckCircle className="h-3 w-3" /> },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', icon: <AlertCircle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500', icon: <FileText className="h-3 w-3" /> },
};

const TYPE_CONFIG: Record<InvoiceType | string, { label: string; icon: React.ReactNode; description: string }> = {
  receivable: { label: 'Receivable', icon: <ArrowDownLeft className="h-4 w-4 text-green-600" />, description: 'You are owed' },
  payable: { label: 'Payable', icon: <ArrowUpRight className="h-4 w-4 text-red-600" />, description: 'You owe' },
  promoter: { label: 'To Promoter', icon: <ArrowUpRight className="h-4 w-4" />, description: 'Invoice to promoter' },
  comedian: { label: 'From Comedian', icon: <ArrowDownLeft className="h-4 w-4" />, description: 'Invoice from comedian' },
  other: { label: 'Other', icon: <FileText className="h-4 w-4" />, description: 'Other invoice' },
};

export default function OrganizationInvoices() {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const { invoices, loading, deleteInvoice, refetchInvoices } = useInvoices();
  const { isGenerating, generatePDF } = usePDFGeneration();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Calculate stats
  const stats = useMemo(() => {
    const totalReceivable = invoices
      .filter(inv => inv.invoice_type === 'receivable' || inv.invoice_type === 'comedian')
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    const totalPayable = invoices
      .filter(inv => inv.invoice_type === 'payable' || inv.invoice_type === 'promoter')
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    const overdue = invoices.filter(inv => inv.status === 'overdue').length;
    const draft = invoices.filter(inv => inv.status === 'draft').length;

    return { totalReceivable, totalPayable, overdue, draft };
  }, [invoices]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_recipients.some(r =>
          r.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Status filter
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || invoice.invoice_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [invoices, searchTerm, statusFilter, typeFilter]);

  const handleDownloadPDF = async (invoice: Invoice) => {
    await generatePDF(invoice, invoice.invoice_items || []);
  };

  const formatCurrency = (amount: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage invoices for {organization.organization_name}
          </p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                <ArrowDownLeft className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Receivables</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalReceivable)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                <ArrowUpRight className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Payables</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalPayable)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
                <FileText className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="receivable">Receivable</SelectItem>
                <SelectItem value="payable">Payable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium">No invoices found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first invoice to get started'}
              </p>
              <Button onClick={() => navigate('/invoices/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
                    const typeConfig = TYPE_CONFIG[invoice.invoice_type] || TYPE_CONFIG.other;
                    const recipient = invoice.invoice_recipients[0];

                    return (
                      <TableRow key={invoice.id} className="group">
                        <TableCell>
                          <div className="font-medium">{invoice.invoice_number}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {typeConfig.icon}
                            <span className="text-sm">{typeConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {recipient?.recipient_name || 'No recipient'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {recipient?.recipient_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.issue_date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.due_date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('gap-1', statusConfig.color)}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total_amount, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownloadPDF(invoice)}
                                disabled={isGenerating}
                              >
                                {isGenerating ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="mr-2 h-4 w-4" />
                                )}
                                Download PDF
                              </DropdownMenuItem>
                              {invoice.status === 'draft' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                                    Edit Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => deleteInvoice(invoice.id)}
                                  >
                                    Delete Invoice
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
