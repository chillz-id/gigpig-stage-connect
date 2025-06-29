
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { InvoiceDetails } from './InvoiceDetails';

export const InvoiceManagement: React.FC = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const mockInvoices = [
    {
      id: '1',
      number: 'INV-00001',
      clientName: 'Comedy Club Downtown',
      amount: 500,
      status: 'paid',
      dueDate: '2024-01-15',
      createdDate: '2024-01-01'
    },
    {
      id: '2',
      number: 'INV-00002',
      clientName: 'Laugh Factory',
      amount: 750,
      status: 'pending',
      dueDate: '2024-02-15',
      createdDate: '2024-02-01'
    },
    {
      id: '3',
      number: 'INV-00003',
      clientName: 'Open Mic Night Venue',
      amount: 200,
      status: 'overdue',
      dueDate: '2024-01-30',
      createdDate: '2024-01-15'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleViewDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowDetails(true);
  };

  return (
    <>
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Invoice Management
          </CardTitle>
          <CardDescription>
            View and manage your invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold">{invoice.number}</span>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                  <p className="text-xs text-muted-foreground">Due: {invoice.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">${invoice.amount}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => handleViewDetails(invoice)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <InvoiceDetails
        invoice={selectedInvoice}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
};
