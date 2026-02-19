import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices } from '@/hooks/useInvoices';
import { useBulkInvoiceOperations } from '@/hooks/useBulkInvoiceOperations';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';
import { InvoiceDetails } from './InvoiceDetails';
import { useAuth } from '@/contexts/AuthContext';
import { Invoice, DateFilter, AmountRange, DEFAULT_AMOUNT_RANGE, InvoiceStatus, InvoiceType } from '@/types/invoice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  AlertCircle,
  AlertTriangle,
  Send,
  CheckCircle,
  ListChecks,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BulkActionsBar } from './invoice/BulkActionsBar';

const STATUS_CONFIG: Record<InvoiceStatus | string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: <FileText className="h-3 w-3" /> },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', icon: <Send className="h-3 w-3" /> },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', icon: <CheckCircle className="h-3 w-3" /> },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', icon: <AlertCircle className="h-3 w-3" /> },
  voided: { label: 'Voided', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300', icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500', icon: <FileText className="h-3 w-3" /> },
};

const TYPE_CONFIG: Record<InvoiceType | string, { label: string; icon: React.ReactNode; description: string }> = {
  receivable: { label: 'Receivable', icon: <ArrowDownLeft className="h-4 w-4 text-green-600" />, description: 'You are owed' },
  payable: { label: 'Payable', icon: <ArrowUpRight className="h-4 w-4 text-red-600" />, description: 'You owe' },
  promoter: { label: 'To Promoter', icon: <ArrowUpRight className="h-4 w-4" />, description: 'Invoice to promoter' },
  comedian: { label: 'From Comedian', icon: <ArrowDownLeft className="h-4 w-4" />, description: 'Invoice from comedian' },
  other: { label: 'Other', icon: <FileText className="h-4 w-4" />, description: 'Other invoice' },
};

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
    ...invoice
  };
};

const formatCurrency = (amount: number, currency: string = 'AUD') => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const InvoiceManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole, isLoading: authLoading, profile } = useAuth();
  const { invoices, loading, error, deleteInvoice, voidInvoice, updateInvoiceStatus, filterInvoices, refetchInvoices } = useInvoices();
  const { isGenerating, generatePDF } = usePDFGeneration();
  const bulkOperations = useBulkInvoiceOperations();
  const {
    selectedCount,
    selectedInvoiceIds,
    clearSelection,
    toggleInvoiceSelection
  } = bulkOperations;
  const selectedInvoiceIdsArray = useMemo(() => Array.from(selectedInvoiceIds), [selectedInvoiceIds]);
  const { sendInvoiceReminder, checkOverdueInvoices } = useInvoiceOperations();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [amountRange, setAmountRange] = useState<AmountRange>(DEFAULT_AMOUNT_RANGE);

  const filteredInvoices = filterInvoices(searchTerm, statusFilter, dateFilter, amountRange);

  // Additionally filter by type
  const displayInvoices = useMemo(() => {
    if (typeFilter === 'all') return filteredInvoices;
    return filteredInvoices.filter(inv => inv.invoice_type === typeFilter);
  }, [filteredInvoices, typeFilter]);

  // Calculate stats - exclude voided and cancelled invoices from totals
  const stats = useMemo(() => {
    const activeStatuses = ['draft', 'sent', 'overdue'];

    const totalReceivable = invoices
      .filter(inv => inv.invoice_type === 'receivable' || inv.invoice_type === 'comedian' || inv.invoice_type === 'other')
      .filter(inv => activeStatuses.includes(inv.status))
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    const totalPayable = invoices
      .filter(inv => inv.invoice_type === 'payable' || inv.invoice_type === 'promoter')
      .filter(inv => activeStatuses.includes(inv.status))
      .reduce((sum, inv) => sum + inv.total_amount, 0);

    const overdue = invoices.filter(inv => inv.status === 'overdue').length;
    const draft = invoices.filter(inv => inv.status === 'draft').length;

    return { totalReceivable, totalPayable, overdue, draft };
  }, [invoices]);

  // Check and update overdue invoices on mount
  useEffect(() => {
    checkOverdueInvoices.mutate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update filtered invoice IDs when filters change
  useEffect(() => {
    if (isSelectionMode && selectedCount > 0) {
      const filteredIds = new Set(displayInvoices.map(inv => inv.id));
      const currentSelected = selectedInvoiceIdsArray;
      const validSelections = currentSelected.filter(id => filteredIds.has(id));

      if (validSelections.length !== currentSelected.length) {
        clearSelection();
        validSelections.forEach(id => toggleInvoiceSelection(id));
      }
    }
  }, [clearSelection, displayInvoices, isSelectionMode, selectedCount, selectedInvoiceIdsArray, toggleInvoiceSelection]);

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetails(true);
  };

  const handleCreateNew = () => {
    navigate('/invoices/new');
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    await generatePDF(invoice, invoice.invoice_items || []);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      clearSelection();
    }
  };

  const handleSelectAll = () => {
    if (selectedCount === displayInvoices.length) {
      clearSelection();
    } else {
      bulkOperations.selectAllInvoices(displayInvoices.map(inv => inv.id));
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

  // Wait for profile to load
  const initialDataLoaded = !user || profile !== null;

  // Show loading while auth or initial data is still loading
  if (authLoading || loading || (user && !initialDataLoaded)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show authentication error if user doesn't have the right role
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
        onExportPDFCombined={bulkOperations.bulkExportPDFCombined}
        onExportPDFZip={bulkOperations.bulkExportPDFZip}
        onClearSelection={clearSelection}
        onCancel={bulkOperations.cancelOperation}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your invoices and payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isSelectionMode ? "default" : "secondary"}
            onClick={toggleSelectionMode}
          >
            <ListChecks className="w-4 h-4 mr-2" />
            {isSelectionMode ? 'Exit Selection' : 'Select Multiple'}
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
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
                <SelectItem value="voided">Voided</SelectItem>
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

      {/* Select All Row */}
      {isSelectionMode && displayInvoices.length > 0 && (
        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
          <Button
            variant="link"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedCount === displayInvoices.length
              ? 'Deselect all'
              : `Select all ${displayInvoices.length} invoices`}
          </Button>
        </div>
      )}

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices ({displayInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium">No invoices found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first invoice to get started'}
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isSelectionMode && <TableHead className="w-[50px]"></TableHead>}
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
                  {displayInvoices.map((invoice) => {
                    const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
                    const typeConfig = TYPE_CONFIG[invoice.invoice_type] || TYPE_CONFIG.other;
                    const recipient = invoice.invoice_recipients[0];
                    const isSelected = selectedInvoiceIds.has(invoice.id);

                    return (
                      <TableRow
                        key={invoice.id}
                        className={cn("group", isSelected && "bg-muted/50")}
                        onClick={() => isSelectionMode && toggleInvoiceSelection(invoice.id)}
                      >
                        {isSelectionMode && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                            />
                          </TableCell>
                        )}
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
                              <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
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

                              {/* Draft actions */}
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

                              {/* Sent/Overdue actions */}
                              {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      setSendingReminderId(invoice.id);
                                      try {
                                        await sendInvoiceReminder.mutateAsync({ invoiceId: invoice.id });
                                      } finally {
                                        setSendingReminderId(null);
                                      }
                                    }}
                                    disabled={sendingReminderId === invoice.id}
                                  >
                                    {sendingReminderId === invoice.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Send className="mr-2 h-4 w-4" />
                                    )}
                                    {sendingReminderId === invoice.id ? 'Sending...' : 'Send Reminder'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateInvoiceStatus(invoice.id, 'paid')}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-orange-600"
                                    onClick={() => voidInvoice(invoice.id)}
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Void Invoice
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Voided actions */}
                              {invoice.status === 'voided' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
                                    Edit & Resend
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => deleteInvoice(invoice.id)}
                                  >
                                    Delete Invoice
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Paid actions */}
                              {invoice.status === 'paid' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => updateInvoiceStatus(invoice.id, 'sent')}>
                                    Mark as Unpaid
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

      <InvoiceDetails
        invoice={selectedInvoice ? transformInvoiceForDetails(selectedInvoice) : null}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </div>
  );
};
