
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket as TicketIcon, Calendar, MapPin, Clock, X } from 'lucide-react';
import { useTickets } from '@/hooks/useTickets';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface TicketsSectionProps {
  isMemberView: boolean;
}

export const TicketsSection: React.FC<TicketsSectionProps> = ({ isMemberView }) => {
  const { tickets, isLoading, cancelTicket, isCancelling } = useTickets();
  const navigate = useNavigate();
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TicketIcon className="w-5 h-5" />
          My Tickets
        </CardTitle>
        <CardDescription>
          Your purchased event tickets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tickets purchased yet</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/shows')}
            >
              Browse Events
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const eventDate = ticket.event?.event_date ? new Date(ticket.event.event_date) : null;
              const isPastEvent = eventDate && eventDate < new Date();
              
              return (
                <div key={ticket.id} className="border rounded-lg bg-background/50 p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                    {ticket.event?.banner_url && (
                      <img 
                        src={ticket.event.banner_url} 
                        alt={ticket.event.title}
                        className="w-full md:w-48 h-32 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg md:text-xl font-semibold mb-2">
                            {ticket.event?.title || 'Event'}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{ticket.event?.venue || 'Venue'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={ticket.status === 'confirmed' ? 'default' : 'secondary'}>
                            {ticket.status}
                          </Badge>
                          {isPastEvent && (
                            <Badge variant="outline">Past</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        {eventDate && (
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Date
                            </p>
                            <p className="font-medium">{format(eventDate, 'MMM d, yyyy')}</p>
                          </div>
                        )}
                        {ticket.event?.start_time && (
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Time
                            </p>
                            <p className="font-medium">{ticket.event.start_time}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium">{ticket.ticket_type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Qty</p>
                          <p className="font-medium">{ticket.quantity}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t">
                        <span className="text-lg font-semibold">
                          Total: ${ticket.total_price.toFixed(2)}
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/events/${ticket.event_id}`)}
                          >
                            View Event
                          </Button>
                          {ticket.status === 'confirmed' && !isPastEvent && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => cancelTicket(ticket.id)}
                              disabled={isCancelling}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
