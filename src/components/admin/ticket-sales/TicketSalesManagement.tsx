
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTicketSalesManagement } from '@/hooks/useTicketSalesManagement';
import { useEventData } from '@/hooks/useEventData';
import { NewSaleState } from '@/types/ticketSales';
import SalesFilterSection from './SalesFilterSection';
import SalesMetricsCards from './SalesMetricsCards';
import AddSaleDialog from './AddSaleDialog';
import SalesTable from './SalesTable';

const TicketSalesManagement = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSale, setNewSale] = useState<NewSaleState>({
    event_id: '',
    customer_name: '',
    customer_email: '',
    ticket_quantity: 1,
    ticket_type: 'general',
    total_amount: 0,
    platform: 'manual',
    platform_order_id: '',
  });

  const { events } = useEventData();
  const { 
    ticketSales, 
    isLoading, 
    salesMetrics, 
    addTicketSale, 
    updateTicketSale 
  } = useTicketSalesManagement(selectedEventId === 'all' ? undefined : selectedEventId);

  const handleAddSale = async () => {
    if (!newSale.event_id || !newSale.customer_name || !newSale.customer_email) {
      return;
    }

    try {
      await addTicketSale.mutateAsync({
        ...newSale,
        refund_status: 'none',
      });
      
      setIsAddDialogOpen(false);
      setNewSale({
        event_id: '',
        customer_name: '',
        customer_email: '',
        ticket_quantity: 1,
        ticket_type: 'general',
        total_amount: 0,
        platform: 'manual',
        platform_order_id: '',
      });
    } catch (error) {
      console.error('Failed to add ticket sale:', error);
    }
  };

  const handleRefund = async (saleId: string, refundStatus: 'partial' | 'full') => {
    try {
      await updateTicketSale.mutateAsync({
        id: saleId,
        updates: { refund_status: refundStatus }
      });
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">Loading ticket sales...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SalesFilterSection
        selectedEventId={selectedEventId}
        setSelectedEventId={setSelectedEventId}
        events={events}
        onAddSaleClick={() => setIsAddDialogOpen(true)}
      />

      <SalesMetricsCards salesMetrics={salesMetrics} />

      <SalesTable 
        ticketSales={ticketSales}
        events={events}
        onRefund={handleRefund}
      />

      <AddSaleDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        newSale={newSale}
        setNewSale={setNewSale}
        events={events}
        onAddSale={handleAddSale}
        isLoading={addTicketSale.isPending}
      />
    </div>
  );
};

export default TicketSalesManagement;
