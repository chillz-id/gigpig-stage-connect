
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const CreateEventButton: React.FC = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [eventDate, setEventDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    address: '',
    description: '',
    comedianSlots: '5',
    payPerComedian: '',
    currency: 'USD',
    duration: '120'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventDate) {
      toast({
        title: "Error",
        description: "Please select an event date.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically send the data to your backend
    
    toast({
      title: "Event Created",
      description: "Your comedy event has been created successfully!",
    });
    
    // Reset form and close dialog
    setFormData({
      title: '',
      venue: '',
      address: '',
      description: '',
      comedianSlots: '5',
      payPerComedian: '',
      currency: 'USD',
      duration: '120'
    });
    setEventDate(undefined);
    setOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Comedy Event</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new comedy show and start receiving applications from comedians.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Comedy Night at..."
                required
              />
            </div>
            
            <div>
              <Label htmlFor="venue">Venue Name</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                placeholder="The Comedy Club"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Venue Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 Main St, City, State 12345"
              required
            />
          </div>

          <div>
            <Label>Event Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"secondary"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !eventDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={setEventDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="description">Event Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your event, the vibe, audience, and any special requirements..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="comedianSlots">Comedian Slots</Label>
              <Input
                id="comedianSlots"
                type="number"
                value={formData.comedianSlots}
                onChange={(e) => handleInputChange('comedianSlots', e.target.value)}
                min="1"
                max="20"
              />
            </div>
            
            <div>
              <Label htmlFor="payPerComedian">Pay Per Comedian</Label>
              <Input
                id="payPerComedian"
                type="number"
                value={formData.payPerComedian}
                onChange={(e) => handleInputChange('payPerComedian', e.target.value)}
                placeholder="50"
                min="0"
              />
            </div>
            
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              min="30"
              max="300"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Create Event
            </Button>
            <Button type="button" className="professional-button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
