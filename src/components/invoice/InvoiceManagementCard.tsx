
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Eye, Download, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Invoice } from '@/types/invoice';

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

  return (
    <Card className="professional-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <CardTitle>Invoice Management</CardTitle>
          </div>
          <Button onClick={onCreateNew} size="sm" className="professional-button">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
        <CardDescription>
          Manage your invoices and track payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border">
            <div className="text-sm text-green-700 font-medium">Total Revenue</div>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border">
            <div className="text-sm text-blue-700 font-medium">Pending</div>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(pendingAmount)}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="text-sm text-gray-700 font-medium">Total Invoices</div>
            <div className="text-2xl font-bold text-gray-900">{invoices.length}</div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Recent Invoices</h4>
          
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No invoices created yet</p>
              <p className="text-xs mt-1">Create your first invoice to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
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
