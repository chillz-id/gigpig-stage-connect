
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, CreditCard, Download, Send } from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  status: string;
  dueDate: string;
  createdDate: string;
  clientEmail?: string;
  clientAddress?: string;
  description?: string;
  items?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

interface InvoiceDetailsProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoice,
  isOpen,
  onClose
}) => {
  if (!invoice) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const mockItems = [
    {
      description: 'Stand-up Comedy Performance - Main Set',
      quantity: 1,
      rate: 400,
      amount: 400
    },
    {
      description: 'Opening Act Performance',
      quantity: 1,
      rate: 100,
      amount: 100
    }
  ];

  const subtotal = mockItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice {invoice.number}</span>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Invoice details and payment information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Bill To:</h4>
              <p className="font-medium">{invoice.clientName}</p>
              <p className="text-sm text-muted-foreground">comedy@venue.com</p>
              <p className="text-sm text-muted-foreground">123 Comedy St, Sydney NSW 2000</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Created: {invoice.createdDate}</span>
              </div>
              <div className="flex items-center justify-end gap-2 mb-2">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">Due: {invoice.dueDate}</span>
              </div>
              <div className="text-lg font-bold">${invoice.amount}</div>
            </div>
          </div>

          <Separator />

          {/* Invoice Items */}
          <div>
            <h4 className="font-semibold mb-3">Items</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Description</th>
                    <th className="text-center p-3">Qty</th>
                    <th className="text-right p-3">Rate</th>
                    <th className="text-right p-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {mockItems.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">${item.rate}</td>
                      <td className="text-right p-3">${item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>${tax}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="space-x-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Reminder
              </Button>
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
