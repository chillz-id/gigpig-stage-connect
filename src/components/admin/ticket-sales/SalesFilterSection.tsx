
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Plus } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  event_date: string;
}

interface SalesFilterSectionProps {
  selectedEventId: string;
  setSelectedEventId: (value: string) => void;
  events: Event[];
  onAddSaleClick: () => void;
}

const SalesFilterSection = ({ 
  selectedEventId, 
  setSelectedEventId, 
  events, 
  onAddSaleClick 
}: SalesFilterSectionProps) => {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Ticket Sales Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <Label className="text-white mb-2 block">Filter by Event</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {new Date(event.event_date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={onAddSaleClick}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Sale
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesFilterSection;
