
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Eye, Download, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Invoice } from '@/types/invoice';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface InvoiceManagementCardProps {
  invoices: Invoice[];
  onViewDetails: (invoice: Invoice) => void;
  onCreateNew: () => void;
}

export const InvoiceManagementCard: React.FC<InvoiceManagementCardProps> = ({
  invoices,
  onViewDetails,
  onCreateNew
}) => {
  const { theme } = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-600 hover:bg-green-700 text-white';
      case 'sent': return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'overdue': return 'bg-red-600 hover:bg-red-700 text-white';
      case 'draft': return 'bg-gray-600 hover:bg-gray-700 text-white';
      default: return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const totalRevenue = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.total_amount, 0);

  const pendingAmount = invoices
    .filter(invoice => invoice.status === 'sent')
    .reduce((sum, invoice) => sum + invoice.total_amount, 0);

  const getStatCardStyles = (color: string) => {
    if (theme === 'pleasure') {
      return `bg-purple-700/60 border-purple-500/40 text-white rounded-xl shadow-lg`;
    }
    return `bg-gray-700/80 border-gray-500/50 text-gray-100 rounded-xl shadow-lg`;
  };

  const getItemStyles = () => {
    if (theme === 'pleasure') {
      return "bg-purple-700/40 border-purple-500/30 hover:bg-purple-600/50";
    }
    return "bg-gray-700/60 border-gray-500/40 hover:bg-gray-600/70";
  };

  return (
    <Card className="invoice-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <CardTitle className={theme === 'pleasure' ? 'text-white' : 'text-gray-100'}>Invoice Management</CardTitle>
          </div>
          <Button onClick={onCreateNew} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
        <CardDescription className={theme === 'pleasure' ? 'text-purple-200' : 'text-gray-300'}>
          Manage your invoices and track payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cn("p-4 border", getStatCardStyles('green'))}>
            <div className={cn("text-sm font-medium", theme === 'pleasure' ? 'text-green-300' : 'text-green-400')}>
              Total Revenue
            </div>
            <div className={cn("text-2xl font-bold", theme === 'pleasure' ? 'text-green-200' : 'text-green-300')}>
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          <div className={cn("p-4 border", getStatCardStyles('blue'))}>
            <div className={cn("text-sm font-medium", theme === 'pleasure' ? 'text-blue-300' : 'text-blue-400')}>
              Pending
            </div>
            <div className={cn("text-2xl font-bold", theme === 'pleasure' ? 'text-blue-200' : 'text-blue-300')}>
              {formatCurrency(pendingAmount)}
            </div>
          </div>
          <div className={cn("p-4 border", getStatCardStyles('gray'))}>
            <div className={cn("text-sm font-medium", theme === 'pleasure' ? 'text-gray-300' : 'text-gray-400')}>
              Total Invoices
            </div>
            <div className={cn("text-2xl font-bold", theme === 'pleasure' ? 'text-gray-200' : 'text-gray-300')}>
              {invoices.length}
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="space-y-4">
          <h4 className={cn("font-medium text-sm", theme === 'pleasure' ? 'text-purple-200' : 'text-gray-300')}>
            Recent Invoices
          </h4>
          
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No invoices created yet</p>
              <p className="text-xs mt-1">Create your first invoice to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className={cn(
                  "flex items-center justify-between p-3 border rounded-lg transition-colors",
                  getItemStyles()
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-sm">{invoice.invoice_number}</span>
                      <Badge className={`${getStatusColor(invoice.status)} text-xs`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {invoice.invoice_recipients.length > 0 
                        ? invoice.invoice_recipients[0].recipient_name 
                        : 'No recipient'}
                    </p>
                    <p className="text-xs text-muted-foreground">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatCurrency(invoice.total_amount, invoice.currency)}</p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDetails(invoice)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              
              {invoices.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all {invoices.length} invoices
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
