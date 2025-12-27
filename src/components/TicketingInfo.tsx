import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Plus, X, ExternalLink } from 'lucide-react';
import { Control, Controller, FieldErrors, useWatch } from 'react-hook-form';
import { EventFormData } from '@/types/eventTypes';
import { useState } from 'react';

interface TicketingInfoProps {
  control: Control<EventFormData>;
  errors: FieldErrors<EventFormData>;
}

interface TicketType {
  name: string;
  price: number;
  description?: string;
  quantity?: number;
}

export const TicketingInfo: React.FC<TicketingInfoProps> = ({ 
  control, 
  errors 
}) => {
  const [newTicket, setNewTicket] = useState<TicketType>({
    name: '',
    price: 0,
    description: '',
    quantity: undefined
  });

  // Watch ticketing type and tickets
  const ticketingType = useWatch({
    control,
    name: 'ticketingType',
    defaultValue: 'external'
  });

  const tickets = useWatch({
    control,
    name: 'tickets',
    defaultValue: []
  });

  const addTicket = () => {
    if (newTicket.name && newTicket.price >= 0) {
      const currentTickets = tickets || [];
      const updatedTickets = [...currentTickets, { ...newTicket }];
      
      control.setValue('tickets', updatedTickets);
      setNewTicket({ name: '', price: 0, description: '', quantity: undefined });
    }
  };

  const removeTicket = (index: number) => {
    const currentTickets = tickets || [];
    const updatedTickets = currentTickets.filter((_, i) => i !== index);
    control.setValue('tickets', updatedTickets);
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Ticketing Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ticketingType">Ticketing Method</Label>
          <Controller
            name="ticketingType"
            control={control}
            defaultValue="external"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">External Platform (Eventbrite, Humanitix, etc.)</SelectItem>
                  <SelectItem value="internal">Internal Ticketing System</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {ticketingType === 'external' && (
          <div>
            <Label htmlFor="externalTicketUrl">Ticket Purchase URL</Label>
            <Controller
              name="externalTicketUrl"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <Input
                    {...field}
                    id="externalTicketUrl"
                    type="url"
                    placeholder="https://www.eventbrite.com/e/your-event"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 pr-10"
                  />
                  <ExternalLink className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              )}
            />
            <p className="text-sm text-gray-300 mt-1">
              Link to where attendees can purchase tickets
            </p>
          </div>
        )}

        {ticketingType === 'internal' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="feeHandling">Fee Handling</Label>
              <Controller
                name="feeHandling"
                control={control}
                defaultValue="absorb"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absorb">Absorb fees (included in ticket price)</SelectItem>
                      <SelectItem value="pass">Pass fees to customer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Ticket Types Management */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Ticket Types</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <Input
                  value={newTicket.name}
                  onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                  placeholder="Ticket name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
                <Input
                  value={newTicket.price}
                  onChange={(e) => setNewTicket({ ...newTicket, price: parseFloat(e.target.value) || 0 })}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price ($)"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
                <Input
                  value={newTicket.quantity || ''}
                  onChange={(e) => setNewTicket({ ...newTicket, quantity: parseInt(e.target.value) || undefined })}
                  type="number"
                  min="1"
                  placeholder="Quantity (optional)"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
                <Button
                  type="button"
                  onClick={addTicket}
                  size="sm"
                  className="professional-button border-white/20 text-white hover:bg-white/10"
                  disabled={!newTicket.name || newTicket.price < 0}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Input
                value={newTicket.description || ''}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Ticket description (optional)"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
              />

              {/* Display existing tickets */}
              <div className="space-y-2">
                {tickets?.map((ticket: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ticket.name}</span>
                        <Badge className="professional-button border-white/20 text-white">
                          ${ticket.price.toFixed(2)}
                        </Badge>
                        {ticket.quantity && (
                          <Badge className="professional-button border-white/20 text-white">
                            Qty: {ticket.quantity}
                          </Badge>
                        )}
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-gray-300 mt-1">{ticket.description}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeTicket(index)}
                      size="sm"
                      variant="destructive"
                      className="ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {tickets?.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  No ticket types added yet. Add your first ticket type above.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};