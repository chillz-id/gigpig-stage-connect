
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InvoiceEmptyStateProps {
  hasInvoices: boolean;
}

export const InvoiceEmptyState: React.FC<InvoiceEmptyStateProps> = ({ hasInvoices }) => {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="text-muted-foreground mb-4">
          {!hasInvoices ? 'No invoices created yet' : 'No invoices match your search'}
        </div>
        <Link to="/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Invoice
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
