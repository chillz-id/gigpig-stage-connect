
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Ticket } from 'lucide-react';
import { EventTicket } from '@/types/eventTypes';

interface EventTicketSectionProps {
  ticketingType: 'gigpigs' | 'external';
  externalTicketUrl: string;
  tickets: EventTicket[];
  onTicketingTypeChange: (type: 'gigpigs' | 'external') => void;
  onExternalTicketUrlChange: (url: string) => void;
  onTicketsChange: (tickets: EventTicket[]) => void;
}

export const EventTicketSection: React.FC<EventTicketSectionProps> = ({
  ticketingType,
  externalTicketUrl,
  tickets,
  onTicketingTypeChange,
  onExternalTicketUrlChange,
  onTicketsChange
}) => {
  const [newTicket, setNewTicket] = useState<EventTicket>({
    ticket_name: '',
    description: '',
    price: 0,
    currency: 'AUD'
  });

  const addTicket = () => {
    if (newTicket.ticket_name.trim()) {
      onTicketsChange([...tickets, { ...newTicket }]);
      setNewTicket({
        ticket_name: '',
        description: '',
        price: 0,
        currency: 'AUD'
      });
    }
  };

  const removeTicket = (index: number) => {
    onTicketsChange(tickets.filter((_, i) => i !== index));
  };

  const handlePriceChange = (value: string) => {
    // Remove leading zeros and handle empty string
    const cleanValue = value.replace(/^0+(?=\d)/, '') || '0';
    const numericValue = parseFloat(cleanValue) || 0;
    setNewTicket(prev => ({ ...prev, price: numericValue }));
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Ticket Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base font-medium mb-3 block">Ticketing System</Label>
          <RadioGroup 
            value={ticketingType} 
            onValueChange={(value) => onTicketingTypeChange(value as 'gigpigs' | 'external')}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gigpigs" id="gigpigs" className="border-white/50" />
              <Label htmlFor="gigpigs" className="cursor-pointer">GigPigs</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="external" id="external" className="border-white/50" />
              <Label htmlFor="external" className="cursor-pointer">External</Label>
            </div>
          </RadioGroup>
        </div>

        {ticketingType === 'external' ? (
          <div>
            <Label htmlFor="externalTicketUrl">Ticket URL</Label>
            <Input
              id="externalTicketUrl"
              value={externalTicketUrl}
              onChange={(e) => onExternalTicketUrlChange(e.target.value)}
              placeholder="https://your-ticketing-site.com/event"
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="ticketName">Ticket Name *</Label>
                <Input
                  id="ticketName"
                  value={newTicket.ticket_name}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, ticket_name: e.target.value }))}
                  placeholder="General Admission"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="ticketDescription">Description (optional)</Label>
                <Input
                  id="ticketDescription"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Show entry ticket"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="ticketPrice">Price *</Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newTicket.price === 0 ? '' : newTicket.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0.00"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="ticketCurrency">Currency</Label>
                <CurrencySelector
                  value={newTicket.currency}
                  onChange={(currency) => setNewTicket(prev => ({ ...prev, currency }))}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <Button 
              type="button" 
              onClick={addTicket} 
              disabled={!newTicket.ticket_name.trim()}
              className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Ticket
            </Button>

            {tickets.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Added Tickets</Label>
                <div className="flex flex-wrap gap-2">
                  {tickets.map((ticket, index) => (
                    <Badge key={index} variant="outline" className="text-white border-white/30 flex items-center gap-2">
                      <span>{ticket.ticket_name} - {ticket.currency} {ticket.price.toFixed(2)}</span>
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-red-300" 
                        onClick={() => removeTicket(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
