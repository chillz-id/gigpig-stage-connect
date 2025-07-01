
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
      case 'paid': return 'bg-green-500 hover:bg-green-600';
      case 'sent': return 'bg-blue-500 hover:bg-blue-600';
      case 'overdue': return 'bg-red-500 hover:bg-red-600';
      case 'draft': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
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

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/[0.08] backdrop-blur-md border-white/[0.15] text-white';
    }
    return 'bg-gray-800/90 border-gray-600 text-gray-100';
  };

  const getStatCardStyles = (color: string) => {
    if (theme === 'pleasure') {
      return `bg-white/[0.06] backdrop-blur-sm border-white/[0.10] text-white rounded-xl`;
    }
    return `bg-${color}-50 border-${color}-200 text-${color}-900 rounded-xl`;
  };

  return (
    <Card className={cn("professional-card", getCardStyles())}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <CardTitle className={theme === 'pleasure' ? 'text-white' : 'text-gray-100'}>Invoice Management</CardTitle>
          </div>
          <Button onClick={onCreateNew} size="sm" className="professional-button">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
        <CardDescription className={theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'}>
          Manage your invoices and track payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cn("p-4 border", getStatCardStyles('green'))}>
            <div className={cn("text-sm font-medium", theme === 'pleasure' ? 'text-green-300' : 'text-green-700')}>
              Total Revenue
            </div>
            <div className={cn("text-2xl font-bold", theme === 'pleasure' ? 'text-green-200' : 'text-green-900')}>
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          <div className={cn("p-4 border", getStatCardStyles('blue'))}>
            <div className={cn("text-sm font-medium", theme === 'pleasure' ? 'text-blue-300' : 'text-blue-700')}>
              Pending
            </div>
            <div className={cn("text-2xl font-bold", theme === 'pleasure' ? 'text-blue-200' : 'text-blue-900')}>
              {formatCurrency(pendingAmount)}
            </div>
          </div>
          <div className={cn("p-4 border", getStatCardStyles('gray'))}>
            <div className={cn("text-sm font-medium", theme === 'pleasure' ? 'text-gray-300' : 'text-gray-700')}>
              Total Invoices
            </div>
            <div className={cn("text-2xl font-bold", theme === 'pleasure' ? 'text-gray-200' : 'text-gray-900')}>
              {invoices.length}
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="space-y-4">
          <h4 className={cn("font-medium text-sm", theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300')}>
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
                  theme === 'pleasure' 
                    ? "bg-white/[0.04] border-white/[0.10] hover:bg-white/[0.08]" 
                    : "bg-gray-700/50 border-gray-600 hover:bg-gray-600/50"
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-sm">{invoice.invoice_number}</span>
                      <Badge className={`${getStatusColor(invoice.status)} text-white text-xs`}>
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
                      <DropdownMenuContent align="end" className={cn(
                        theme === 'pleasure' 
                          ? "bg-white/[0.08] backdrop-blur-md border-white/[0.15] text-white" 
                          : "bg-gray-800 border-gray-600 text-gray-100"
                      )}>
                        <DropdownMenuItem onClick={() => onViewDetails(invoice)} className="hover:bg-white/[0.08]">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-white/[0.08]">
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
