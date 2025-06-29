
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEventData } from '@/hooks/useEventData';

interface MarketingCostFormProps {
  onSuccess: () => void;
}

const MarketingCostForm = ({ onSuccess }: MarketingCostFormProps) => {
  const [formData, setFormData] = useState({
    event_id: '',
    campaign_name: '',
    platform: '',
    cost_type: 'advertising',
    amount: '',
    spend_date: new Date().toISOString().split('T')[0],
    impressions: '',
    clicks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { events } = useEventData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('marketing_costs')
        .insert([{
          event_id: formData.event_id || null,
          campaign_name: formData.campaign_name || null,
          platform: formData.platform || null,
          cost_type: formData.cost_type,
          amount: parseFloat(formData.amount),
          spend_date: formData.spend_date,
          impressions: formData.impressions ? parseInt(formData.impressions) : null,
          clicks: formData.clicks ? parseInt(formData.clicks) : null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Marketing cost added successfully!",
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding marketing cost:', error);
      toast({
        title: "Error",
        description: "Failed to add marketing cost. Please try again.",
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
          <Label htmlFor="campaign_name" className="text-white">Campaign Name</Label>
          <Input
            id="campaign_name"
            value={formData.campaign_name}
            onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
            placeholder="Enter campaign name"
          />
        </div>

        <div>
          <Label htmlFor="platform" className="text-white">Platform</Label>
          <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="google">Google Ads</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="event_id" className="text-white">Event (Optional)</Label>
          <Select value={formData.event_id} onValueChange={(value) => setFormData({ ...formData, event_id: value })}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select event (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No specific event</SelectItem>
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
              <SelectItem value="advertising">Advertising</SelectItem>
              <SelectItem value="promotional_materials">Promotional Materials</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="influencer">Influencer</SelectItem>
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
          <Label htmlFor="spend_date" className="text-white">Spend Date</Label>
          <Input
            id="spend_date"
            type="date"
            value={formData.spend_date}
            onChange={(e) => setFormData({ ...formData, spend_date: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
            required
          />
        </div>

        <div>
          <Label htmlFor="impressions" className="text-white">Impressions (Optional)</Label>
          <Input
            id="impressions"
            type="number"
            min="0"
            value={formData.impressions}
            onChange={(e) => setFormData({ ...formData, impressions: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
            placeholder="Number of impressions"
          />
        </div>

        <div>
          <Label htmlFor="clicks" className="text-white">Clicks (Optional)</Label>
          <Input
            id="clicks"
            type="number"
            min="0"
            value={formData.clicks}
            onChange={(e) => setFormData({ ...formData, clicks: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
            placeholder="Number of clicks"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
          {isSubmitting ? 'Adding...' : 'Add Marketing Cost'}
        </Button>
      </div>
    </form>
  );
};

export default MarketingCostForm;
