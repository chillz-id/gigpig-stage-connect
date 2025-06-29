
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEventData } from '@/hooks/useEventData';

interface VenueCostFormProps {
  onSuccess: () => void;
}

const VenueCostForm = ({ onSuccess }: VenueCostFormProps) => {
  const [formData, setFormData] = useState({
    event_id: '',
    cost_type: 'venue_rental',
    description: '',
    amount: '',
    cost_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { events } = useEventData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('venue_costs')
        .insert([{
          event_id: formData.event_id,
          cost_type: formData.cost_type,
          description: formData.description || null,
          amount: parseFloat(formData.amount),
          cost_date: formData.cost_date
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Venue cost added successfully!",
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding venue cost:', error);
      toast({
        title: "Error",
        description: "Failed to add venue cost. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="event_id" className="text-white">Event</Label>
          <Select value={formData.event_id} onValueChange={(value) => setFormData({ ...formData, event_id: value })}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} - {new Date(event.event_date).toLocaleDateString('en-AU')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cost_type" className="text-white">Cost Type</Label>
          <Select value={formData.cost_type} onValueChange={(value) => setFormData({ ...formData, cost_type: value })}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="venue_rental">Venue Rental</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="amount" className="text-white">Amount (AUD)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
            required
          />
        </div>

        <div>
          <Label htmlFor="cost_date" className="text-white">Cost Date</Label>
          <Input
            id="cost_date"
            type="date"
            value={formData.cost_date}
            onChange={(e) => setFormData({ ...formData, cost_date: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-white">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-white/10 border-white/20 text-white"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? 'Adding...' : 'Add Venue Cost'}
        </Button>
      </div>
    </form>
  );
};

export default VenueCostForm;
