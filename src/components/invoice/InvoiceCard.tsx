
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Invoice } from '@/types/invoice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h3 className="text-lg font-semibold break-all">{invoice.invoice_number}</h3>
              <Badge className={`${getStatusColor(invoice.status)} w-fit`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="break-all">
                To: {invoice.invoice_recipients[0]?.recipient_name} ({invoice.invoice_recipients[0]?.recipient_email})
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4 gap-1">
                <div>
                  Issue: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                </div>
                <div>
                  Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:text-right gap-4">
            <div className="text-xl sm:text-2xl font-bold">
              {invoice.currency} {invoice.total_amount.toFixed(2)}
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden sm:flex gap-2">
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

            {/* Mobile Actions - Dropdown Menu */}
            <div className="sm:hidden flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(invoice.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
