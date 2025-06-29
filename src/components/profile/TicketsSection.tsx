
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';

interface Ticket {
  id: number;
  eventTitle: string;
  venue: string;
  date: string;
  time: string;
  ticketType: string;
  quantity: number;
  totalPrice: number;
  eventImage: string;
}

interface TicketsSectionProps {
  tickets: Ticket[];
  isMemberView: boolean;
}

export const TicketsSection: React.FC<TicketsSectionProps> = ({ tickets, isMemberView }) => {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          My Tickets
        </CardTitle>
        <CardDescription>
          Your purchased event tickets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tickets purchased yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg bg-background/50 p-6">
                <div className="flex gap-6">
                  <img 
                    src={ticket.eventImage} 
                    alt={ticket.eventTitle}
                    className="w-64 h-48 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{ticket.eventTitle}</h3>
                        <p className="text-lg text-muted-foreground">{ticket.venue}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-base mb-4">
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{new Date(ticket.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <p className="font-medium">{ticket.time}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ticket Type</p>
                        <p className="font-medium">{ticket.ticketType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium">{ticket.quantity}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-xl font-semibold">Total: ${ticket.totalPrice.toFixed(2)}</span>
                      <Button variant="outline" size="sm">
                        View Tickets
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Shows Attended Counter for Members */}
        {isMemberView && (
          <Card className="bg-primary/5 border-primary/20 mt-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold mb-1">Shows Attended</h4>
                  <p className="text-muted-foreground">Your comedy show attendance history</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{tickets.length}</div>
                  <p className="text-sm text-muted-foreground">Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
