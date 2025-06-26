
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Invoice } from '@/types/invoice';

interface InvoiceCardProps {
  invoice: Invoice;
  onDelete: (invoiceId: string) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onDelete }) => {
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

  return (
    <Card className="hover:shadow-md transition-shadow">
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
                onClick={() => onDelete(invoice.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
