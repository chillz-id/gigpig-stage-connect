
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Clock, CreditCard, Users, Ticket, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TicketPageProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketPage: React.FC<TicketPageProps> = ({
  event,
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [selectedTickets, setSelectedTickets] = useState<{[key: string]: number}>({});
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  if (!event) return null;

  const mockTickets = [
    {
      id: '1',
      name: 'General Admission',
      description: 'Standard entry ticket',
      price: 25.00,
      available: 50
    },
    {
      id: '2', 
      name: 'VIP Package',
      description: 'Premium seating + meet & greet',
      price: 65.00,
      available: 10
    },
    {
      id: '3',
      name: 'Group Booking (4+ people)',
      description: 'Discounted rate for groups',
      price: 20.00,
      available: 20
    }
  ];

  const handleTicketChange = (ticketId: string, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: Math.max(0, quantity)
    }));
  };

  const calculateTotal = () => {
    let subtotal = 0;
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      const ticket = mockTickets.find(t => t.id === ticketId);
      if (ticket) {
        subtotal += ticket.price * quantity;
      }
    });
    
    const platformFee = 1.00; // $1 platform fee
    const processingFee = subtotal * 0.029 + 0.30; // Stripe fees
    const total = subtotal + platformFee + processingFee;
    
    return {
      subtotal,
      platformFee,
      processingFee,
      total
    };
  };

  const handlePurchase = () => {
    const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
    
    if (totalTickets === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket to purchase.",
        variant: "destructive",
      });
      return;
    }

    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      toast({
        title: "Missing information",
        description: "Please fill in your first name, last name, and email address.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Tickets purchased!",
      description: `Successfully purchased ${totalTickets} ticket(s) for ${event.title}. Confirmation email sent to ${customerInfo.email}.`,
    });
    
    onClose();
  };

  const { subtotal, platformFee, processingFee, total } = calculateTotal();
  const eventDate = new Date(event.event_date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Buy Tickets - {event.title}
          </DialogTitle>
          <DialogDescription>
            Select your tickets and complete your purchase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">{event.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{eventDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{event.start_time || 'Time TBA'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{event.city}, {event.state}</span>
              </div>
            </div>
          </div>

          {/* Ticket Selection */}
          <div>
            <h4 className="font-semibold mb-3">Select Tickets</h4>
            <div className="space-y-3">
              {mockTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium">{ticket.name}</h5>
                      <p className="text-sm text-muted-foreground">{ticket.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${ticket.price.toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs">
                        {ticket.available} left
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`ticket-${ticket.id}`}>Quantity:</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTicketChange(ticket.id, (selectedTickets[ticket.id] || 0) - 1)}
                        disabled={(selectedTickets[ticket.id] || 0) <= 0}
                      >
                        -
                      </Button>
                      <Input
                        id={`ticket-${ticket.id}`}
                        type="number"
                        min="0"
                        max={ticket.available}
                        value={selectedTickets[ticket.id] || 0}
                        onChange={(e) => handleTicketChange(ticket.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTicketChange(ticket.id, (selectedTickets[ticket.id] || 0) + 1)}
                        disabled={(selectedTickets[ticket.id] || 0) >= ticket.available}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h4 className="font-semibold mb-3">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Surname *</Label>
                <Input
                  id="lastName"
                  value={customerInfo.lastName}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+61 400 000 000"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          {subtotal > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Order Summary</h4>
              <div className="space-y-2">
                {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
                  const ticket = mockTickets.find(t => t.id === ticketId);
                  if (!ticket || quantity === 0) return null;
                  
                  return (
                    <div key={ticketId} className="flex justify-between text-sm">
                      <span>{ticket.name} × {quantity}</span>
                      <span>${(ticket.price * quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Platform Fee</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing Fee</span>
                  <span>${processingFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={subtotal === 0}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Purchase Tickets (${total.toFixed(2)})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
