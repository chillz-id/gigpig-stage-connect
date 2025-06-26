
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const InvoiceLoadingState: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/3"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
