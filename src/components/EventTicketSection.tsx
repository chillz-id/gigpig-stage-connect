
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Ticket, Info } from 'lucide-react';
import { EventTicket } from '@/types/eventTypes';

interface EventTicketSectionProps {
  ticketingType: 'gigpigs' | 'external';
  externalTicketUrl: string;
  tickets: EventTicket[];
  feeHandling: 'absorb' | 'pass_to_customer';
  onTicketingTypeChange: (type: 'gigpigs' | 'external') => void;
  onExternalTicketUrlChange: (url: string) => void;
  onTicketsChange: (tickets: EventTicket[]) => void;
  onFeeHandlingChange: (handling: 'absorb' | 'pass_to_customer') => void;
}

// Processing fee calculation (2.9% + $0.30 AUD for domestic cards)
const calculateProcessingFee = (amount: number, currency: string = 'AUD') => {
  const feePercentage = 0.029; // 2.9%
  const fixedFee = currency === 'AUD' ? 0.30 : 0.30; // Simplified for demo
  return (amount * feePercentage) + fixedFee;
};

const calculateGigPigsFee = (amount: number) => {
  return 1.00; // $1 GigPigs platform fee
};

export const EventTicketSection: React.FC<EventTicketSectionProps> = ({
  ticketingType,
  externalTicketUrl,
  tickets,
  feeHandling,
  onTicketingTypeChange,
  onExternalTicketUrlChange,
  onTicketsChange,
  onFeeHandlingChange
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

  const getTicketFeeBreakdown = (ticket: EventTicket) => {
    const processingFee = calculateProcessingFee(ticket.price, ticket.currency);
    const gigpigsFee = calculateGigPigsFee(ticket.price);
    const totalFees = processingFee + gigpigsFee;

    const customerPrice = feeHandling === 'pass_to_customer' ? ticket.price + totalFees : ticket.price;
    const promoterReceives = feeHandling === 'pass_to_customer' ? ticket.price : ticket.price - totalFees;

    return {
      processingFee,
      gigpigsFee,
      totalFees,
      customerPrice,
      promoterReceives
    };
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
            {/* Fee Handling Option */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Fee Handling</Label>
                <Info className="w-4 h-4 text-blue-300" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={feeHandling === 'pass_to_customer'}
                  onCheckedChange={(checked) => 
                    onFeeHandlingChange(checked ? 'pass_to_customer' : 'absorb')
                  }
                />
                <Label className="text-sm">
                  {feeHandling === 'pass_to_customer' 
                    ? 'Pass fees to customer' 
                    : 'Absorb fees from payout'
                  }
                </Label>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                {feeHandling === 'pass_to_customer' 
                  ? 'Customers pay the ticket price plus fees'
                  : 'You receive the ticket price minus fees'
                }
              </p>
            </div>

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
                <Label htmlFor="ticketPrice">Ticket Price *</Label>
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

            {/* Fee Preview for Current Ticket */}
            {newTicket.price > 0 && (
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-300/20">
                <Label className="text-sm font-medium text-blue-200 mb-2 block">Fee Preview</Label>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-300">Processing Fee: {newTicket.currency} {calculateProcessingFee(newTicket.price, newTicket.currency).toFixed(2)}</p>
                    <p className="text-gray-300">GigPigs Fee: {newTicket.currency} {calculateGigPigsFee(newTicket.price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-white">Customer Pays: {newTicket.currency} {(feeHandling === 'pass_to_customer' ? newTicket.price + calculateProcessingFee(newTicket.price, newTicket.currency) + calculateGigPigsFee(newTicket.price) : newTicket.price).toFixed(2)}</p>
                    <p className="text-green-300">You Receive: {newTicket.currency} {(feeHandling === 'pass_to_customer' ? newTicket.price : newTicket.price - calculateProcessingFee(newTicket.price, newTicket.currency) - calculateGigPigsFee(newTicket.price)).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

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
              <div className="space-y-3">
                <Label className="text-sm font-medium">Added Tickets</Label>
                <div className="space-y-2">
                  {tickets.map((ticket, index) => {
                    const feeBreakdown = getTicketFeeBreakdown(ticket);
                    return (
                      <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="professional-button text-white border-white/30">
                              {ticket.ticket_name}
                            </Badge>
                            <span className="text-sm text-gray-300">
                              Base: {ticket.currency} {ticket.price.toFixed(2)}
                            </span>
                          </div>
                          <X 
                            className="w-4 h-4 cursor-pointer hover:text-red-300" 
                            onClick={() => removeTicket(index)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-gray-400">Fees: {ticket.currency} {feeBreakdown.totalFees.toFixed(2)}</p>
                            <p className="text-gray-400">• Processing: {feeBreakdown.processingFee.toFixed(2)}</p>
                            <p className="text-gray-400">• GigPigs: {feeBreakdown.gigpigsFee.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white">Customer: {ticket.currency} {feeBreakdown.customerPrice.toFixed(2)}</p>
                            <p className="text-green-300">You get: {ticket.currency} {feeBreakdown.promoterReceives.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
