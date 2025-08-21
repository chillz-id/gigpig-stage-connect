
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NewSaleState, PlatformType } from '@/types/ticketSales';

interface Event {
  id: string;
  title: string;
  event_date: string;
}

interface AddSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newSale: NewSaleState;
  setNewSale: React.Dispatch<React.SetStateAction<NewSaleState>>;
  events: Event[];
  onAddSale: () => void;
  isLoading: boolean;
}

const AddSaleDialog = ({
  isOpen,
  onClose,
  newSale,
  setNewSale,
  events,
  onAddSale,
  isLoading
}: AddSaleDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Add Ticket Sale</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-white">Event</Label>
            <Select value={newSale.event_id} onValueChange={(value) => setNewSale(prev => ({ ...prev, event_id: value }))}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {new Date(event.event_date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Customer Name</Label>
              <Input
                value={newSale.customer_name}
                onChange={(e) => setNewSale(prev => ({ ...prev, customer_name: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Customer Email</Label>
              <Input
                type="email"
                value={newSale.customer_email}
                onChange={(e) => setNewSale(prev => ({ ...prev, customer_email: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-white">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={newSale.ticket_quantity}
                onChange={(e) => setNewSale(prev => ({ ...prev, ticket_quantity: parseInt(e.target.value) || 1 }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Total Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={newSale.total_amount}
                onChange={(e) => setNewSale(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Platform</Label>
              <Select value={newSale.platform} onValueChange={(value: PlatformType) => setNewSale(prev => ({ ...prev, platform: value }))}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="humanitix">Humanitix</SelectItem>
                  <SelectItem value="eventbrite">Eventbrite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onAddSale} disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Sale'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSaleDialog;
