
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Calendar, MapPin, Users, DollarSign } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  venue: string;
  event_date: string;
  status: string;
  capacity: number;
  tickets_sold: number;
  total_revenue: number;
  comedian_slots: number;
  filled_slots: number;
  city: string;
  state: string;
  description?: string;
  address?: string;
  ticket_price?: number;
  start_time?: string;
  end_time?: string;
  requirements?: string;
  age_restriction?: string;
  dress_code?: string;
  allow_recording?: boolean;
}

interface EventDetailsTabProps {
  eventId: string;
  event: Event;
  onEventUpdate: (event: Event) => void;
}

const EventDetailsTab: React.FC<EventDetailsTabProps> = ({ eventId, event, onEventUpdate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title || '',
    venue: event.venue || '',
    description: event.description || '',
    address: event.address || '',
    city: event.city || '',
    state: event.state || '',
    capacity: event.capacity || 0,
    comedian_slots: event.comedian_slots || 5,
    ticket_price: event.ticket_price || 0,
    start_time: event.start_time || '',
    end_time: event.end_time || '',
    requirements: event.requirements || '',
    age_restriction: event.age_restriction || '18+',
    dress_code: event.dress_code || 'Casual',
    allow_recording: event.allow_recording || false,
    status: event.status || 'open'
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          venue: formData.venue,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          capacity: formData.capacity,
          comedian_slots: formData.comedian_slots,
          ticket_price: formData.ticket_price,
          start_time: formData.start_time,
          end_time: formData.end_time,
          requirements: formData.requirements,
          age_restriction: formData.age_restriction,
          dress_code: formData.dress_code,
          allow_recording: formData.allow_recording,
          status: formData.status
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      // Update the parent component with new event data
      onEventUpdate({ ...event, ...formData });

      toast({
        title: "Event Updated",
        description: "Event details have been successfully updated",
      });

    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <div className="text-white/60 text-sm">Event Date</div>
            <div className="text-white font-medium">
              {new Date(event.event_date).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <div className="text-white/60 text-sm">Capacity</div>
            <div className="text-white font-medium">{event.capacity}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <div className="text-white/60 text-sm">Revenue</div>
            <div className="text-white font-medium">${event.total_revenue}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4 text-center">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            <div className="text-white/60 text-sm">Location</div>
            <div className="text-white font-medium">{event.city}</div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Form */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Event Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Event Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                placeholder="Enter event title"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Venue
              </label>
              <Input
                value={formData.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                placeholder="Enter venue name"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Address
            </label>
            <Input
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              placeholder="Enter full address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                City
              </label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                placeholder="Enter city"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                State
              </label>
              <Input
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                placeholder="Enter state"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Capacity
              </label>
              <Input
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Comedian Slots
              </label>
              <Input
                type="number"
                value={formData.comedian_slots}
                onChange={(e) => handleInputChange('comedian_slots', parseInt(e.target.value) || 5)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                placeholder="5"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Ticket Price ($)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.ticket_price}
                onChange={(e) => handleInputChange('ticket_price', parseFloat(e.target.value) || 0)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Start Time
              </label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                End Time
              </label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Requirements
            </label>
            <Textarea
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              placeholder="Enter any specific requirements for comedians"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Age Restriction
              </label>
              <select
                value={formData.age_restriction}
                onChange={(e) => handleInputChange('age_restriction', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="All Ages">All Ages</option>
                <option value="18+">18+</option>
                <option value="21+">21+</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Dress Code
              </label>
              <select
                value={formData.dress_code}
                onChange={(e) => handleInputChange('dress_code', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="Casual">Casual</option>
                <option value="Smart Casual">Smart Casual</option>
                <option value="Formal">Formal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Event Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="published">Published</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allow_recording"
              checked={formData.allow_recording}
              onCheckedChange={(checked) => handleInputChange('allow_recording', checked === true)}
            />
            <Label htmlFor="allow_recording" className="text-white/80 text-sm cursor-pointer">
              Allow recording during performances
            </Label>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSaveChanges}
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDetailsTab;
