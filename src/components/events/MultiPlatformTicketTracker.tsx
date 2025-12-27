import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TicketPlatform {
  platform: string;
  tickets_sold: number;
  tickets_available: number;
  gross_sales: number;
  url: string;
  last_sync: string;
  is_primary: boolean;
}

interface EventTicketSummary {
  id: string;
  title: string;
  event_date: string;
  venue: string;
  capacity: number;
  platforms_count: number;
  total_tickets_sold: number;
  total_tickets_available: number;
  total_gross_sales: number;
  platform_breakdown: TicketPlatform[];
  tickets_sold_last_hour: number;
  capacity_utilization_percent: number;
}

interface MultiPlatformTicketTrackerProps {
  eventId: string;
}

export const MultiPlatformTicketTracker: React.FC<MultiPlatformTicketTrackerProps> = ({ eventId }) => {
  const { data: ticketData, isLoading } = useQuery({
    queryKey: ['event-tickets', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_ticket_summary')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      return data as EventTicketSummary;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      humanitix: 'bg-purple-500',
      eventbrite: 'bg-orange-500',
      ticketek: 'bg-blue-500',
      trybooking: 'bg-green-500',
      moshtix: 'bg-pink-500',
      direct: 'bg-gray-500',
    };
    return colors[platform] || 'bg-gray-400';
  };

  const getPlatformLogo = (platform: string) => {
    // In production, these would be actual logo URLs
    const logos: Record<string, string> = {
      humanitix: '🎟️',
      eventbrite: '🎫',
      ticketek: '🎪',
      trybooking: '📋',
      moshtix: '🎸',
      direct: '💳',
    };
    return logos[platform] || '🎟️';
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading ticket data...</div>;
  }

  if (!ticketData) {
    return <div>No ticket data available</div>;
  }

  const sortedPlatforms = [...(ticketData.platform_breakdown || [])]
    .sort((a, b) => b.tickets_sold - a.tickets_sold);

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Multi-Platform Ticket Sales</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {ticketData.platforms_count} Platform{ticketData.platforms_count !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Sold</p>
              <p className="text-2xl font-bold">{ticketData.total_tickets_sold}</p>
              <p className="text-sm text-muted-foreground">of {ticketData.capacity}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Capacity</p>
              <p className="text-2xl font-bold">{ticketData.capacity_utilization_percent}%</p>
              <Progress value={ticketData.capacity_utilization_percent} className="mt-2" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${ticketData.total_gross_sales.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4" /> Last Hour
              </p>
              <p className="text-2xl font-bold text-green-600">
                +{ticketData.tickets_sold_last_hour}
              </p>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="space-y-4">
            {sortedPlatforms.map((platform) => (
              <div key={platform.platform} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getPlatformLogo(platform.platform)}</span>
                    <div>
                      <h4 className="font-semibold capitalize flex items-center gap-2">
                        {platform.platform}
                        {platform.is_primary && (
                          <Badge className="professional-button text-xs">Primary</Badge>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last sync: {new Date(platform.last_sync).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="professional-button"
                    size="sm"
                    onClick={() => window.open(platform.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tickets Sold</p>
                    <p className="font-semibold">{platform.tickets_sold}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="font-semibold">{platform.tickets_available}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="font-semibold flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {platform.gross_sales.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Platform-specific progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Platform Capacity</span>
                    <span>{((platform.tickets_sold / (platform.tickets_sold + platform.tickets_available)) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={(platform.tickets_sold / (platform.tickets_sold + platform.tickets_available)) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add New Platform Button */}
          <div className="mt-6 text-center">
            <Button className="professional-button w-full">
              + Add Another Ticketing Platform
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};