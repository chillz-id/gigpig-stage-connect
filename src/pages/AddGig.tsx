import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ArrowLeft, Plus, Repeat } from 'lucide-react';
import { useMyGigs } from '@/hooks/useMyGigs';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { EventBannerUpload } from '@/components/gigs/EventBannerUpload';
import { RecurringGigPicker } from '@/components/gigs/RecurringGigPicker';
import { SHOW_TYPES, type ShowType } from '@/services/gigs/manual-gigs-service';

const AddGig = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const { createGig, createRecurringGig, isCreating, isCreatingRecurring } = useMyGigs();

  const [formData, setFormData] = useState({
    title: '',
    type: '' as ShowType | '',
    venue_name: '',
    venue_address: '',
    start_datetime: '',
    start_time: '19:00',
    end_datetime: '',
    end_time: '',
    description: '',
    ticket_link: '',
    banner_url: '',
    is_recurring: false,
    recurrence_pattern: 'weekly' as 'weekly' | 'monthly' | 'custom',
    recurrence_frequency: 1,
    recurrence_day_of_week: undefined as number | undefined,
    recurrence_day_of_month: undefined as number | undefined,
    recurrence_end_date: undefined as Date | undefined,
    recurrence_custom_dates: [] as Date[]
  });

  // Redirect if not a comedian
  if (!user || !(hasRole('comedian') || hasRole('comedian_lite'))) {
    navigate('/profile');
    return null;
  }

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/10 backdrop-blur-sm border-white/20';
    }
    return 'bg-gray-800/90 border-gray-600';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎭 [AddGig] Form submitted with data:', formData);

    if (!formData.title.trim() || !formData.start_datetime) {
      console.log('❌ [AddGig] Validation failed');
      return;
    }

    if (!user?.id) {
      console.log('❌ [AddGig] No user ID');
      return;
    }

    try {
      // Combine date and time for start
      const startDateTime = `${formData.start_datetime}T${formData.start_time}:00`;
      console.log('🎭 [AddGig] Start date/time:', startDateTime);

      // Combine date and time for end (if provided)
      let endDateTime = null;
      if (formData.end_datetime && formData.end_time) {
        endDateTime = `${formData.end_datetime}T${formData.end_time}:00`;
      }

      const baseGigData = {
        user_id: user.id,
        title: formData.title.trim(),
        type: formData.type || null,
        venue_name: formData.venue_name.trim() || null,
        venue_address: formData.venue_address.trim() || null,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        description: formData.description.trim() || null,
        ticket_link: formData.ticket_link.trim() || null,
        banner_url: formData.banner_url || null
      };

      if (formData.is_recurring) {
        // Create recurring gig
        const recurringGigData = {
          ...baseGigData,
          is_recurring: true,
          recurrence_pattern: formData.recurrence_pattern,
          recurrence_frequency: formData.recurrence_frequency,
          recurrence_day_of_week: formData.recurrence_day_of_week || null,
          recurrence_day_of_month: formData.recurrence_day_of_month || null,
          recurrence_end_date: formData.recurrence_end_date?.toISOString() || null,
          recurrence_custom_dates: formData.recurrence_custom_dates.map(d => d.toISOString()) || null,
          parent_gig_id: null
        };

        console.log('🔄 [AddGig] Calling createRecurringGig with:', recurringGigData);
        createRecurringGig(recurringGigData);
      } else {
        // Create single gig
        const singleGigData = {
          ...baseGigData,
          is_recurring: false,
          recurrence_pattern: null,
          recurrence_frequency: null,
          recurrence_day_of_week: null,
          recurrence_day_of_month: null,
          recurrence_end_date: null,
          recurrence_custom_dates: null,
          parent_gig_id: null
        };

        console.log('🎭 [AddGig] Calling createGig with:', singleGigData);
        createGig(singleGigData);
      }

      console.log('✅ [AddGig] Successfully triggered gig creation, navigating to profile');
      // Navigate back to profile calendar tab
      navigate('/profile?tab=calendar');
    } catch (error) {
      console.error('❌ [AddGig] Failed to add gig:', error);
    }
  };

  const isFormValid = formData.title.trim() && formData.start_datetime;

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => navigate(-1)}
              className="professional-button flex items-center gap-2"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-white">Add New Show</h1>
          </div>

          {/* Form */}
          <Card className={cn(getCardStyles(), "text-white")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-6 h-6 text-purple-400" />
                Show Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Event Banner */}
                <div>
                  <Label className="text-white">Event Banner (Optional)</Label>
                  <EventBannerUpload
                    onBannerSelected={(url) => handleInputChange('banner_url', url)}
                    currentBannerUrl={formData.banner_url}
                  />
                </div>

                {/* Show Title */}
                <div>
                  <Label htmlFor="title" className="text-white">Show Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Comedy Night at The Laugh Track"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    required
                  />
                </div>

                {/* Show Type */}
                <div>
                  <Label htmlFor="type" className="text-white">Show Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select show type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHOW_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Venue Name */}
                <div>
                  <Label htmlFor="venue_name" className="text-white">Venue Name</Label>
                  <Input
                    id="venue_name"
                    value={formData.venue_name}
                    onChange={(e) => handleInputChange('venue_name', e.target.value)}
                    placeholder="e.g., The Comedy Store Sydney"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                  />
                </div>

                {/* Venue Address */}
                <div>
                  <Label htmlFor="venue_address" className="text-white">Venue Address</Label>
                  <Input
                    id="venue_address"
                    value={formData.venue_address}
                    onChange={(e) => handleInputChange('venue_address', e.target.value)}
                    placeholder="e.g., 1 Comedy Lane, Sydney"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                  />
                </div>

                {/* Start Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_datetime" className="text-white">Start Date *</Label>
                    <Input
                      id="start_datetime"
                      type="date"
                      value={formData.start_datetime}
                      onChange={(e) => handleInputChange('start_datetime', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      min={format(new Date(), 'yyyy-MM-dd')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_time" className="text-white">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                {/* End Date and Time (Optional) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="end_datetime" className="text-white">End Date (Optional)</Label>
                    <Input
                      id="end_datetime"
                      type="date"
                      value={formData.end_datetime}
                      onChange={(e) => handleInputChange('end_datetime', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      min={formData.start_datetime || format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time" className="text-white">End Time (Optional)</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                {/* Show Description */}
                <div>
                  <Label htmlFor="description" className="text-white">Show Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your show, what makes it special, what the audience can expect..."
                    rows={3}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                  />
                </div>

                {/* Ticket Link */}
                <div>
                  <Label htmlFor="ticket_link" className="text-white">Ticket Link (Optional)</Label>
                  <Input
                    id="ticket_link"
                    type="url"
                    value={formData.ticket_link}
                    onChange={(e) => handleInputChange('ticket_link', e.target.value)}
                    placeholder="https://humanitix.com/... or https://eventbrite.com/..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                  />
                  <p className="text-xs text-gray-300 mt-1">
                    Where customers can buy tickets (Humanitix, Eventbrite, etc.). This will appear on your public EPK.
                  </p>
                </div>

                {/* Recurring Event Toggle */}
                <div className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <Repeat className="w-5 h-5 text-purple-400" />
                    <div>
                      <Label htmlFor="is_recurring" className="text-white font-medium cursor-pointer">
                        Recurring Event
                      </Label>
                      <p className="text-sm text-gray-300">
                        Set up a repeating event schedule
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({
                        ...prev,
                        is_recurring: checked
                      }));
                    }}
                  />
                </div>

                {/* Recurring Pattern Picker */}
                {formData.is_recurring && (
                  <RecurringGigPicker
                    pattern={formData.recurrence_pattern}
                    onPatternChange={(pattern) => setFormData(prev => ({ ...prev, recurrence_pattern: pattern }))}
                    frequency={formData.recurrence_frequency}
                    onFrequencyChange={(freq) => setFormData(prev => ({ ...prev, recurrence_frequency: freq }))}
                    dayOfWeek={formData.recurrence_day_of_week}
                    onDayOfWeekChange={(day) => setFormData(prev => ({ ...prev, recurrence_day_of_week: day }))}
                    dayOfMonth={formData.recurrence_day_of_month}
                    onDayOfMonthChange={(day) => setFormData(prev => ({ ...prev, recurrence_day_of_month: day }))}
                    customDates={formData.recurrence_custom_dates}
                    onCustomDatesChange={(dates) => setFormData(prev => ({ ...prev, recurrence_custom_dates: dates }))}
                    endDate={formData.recurrence_end_date}
                    onEndDateChange={(date) => setFormData(prev => ({ ...prev, recurrence_end_date: date }))}
                  />
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    className="professional-button flex-1"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isFormValid || isCreating || isCreatingRecurring}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {(isCreating || isCreatingRecurring) ? 'Adding...' : 'Add Show'}
                  </Button>
                </div>

                {/* Help Text */}
                <div className="text-sm text-gray-300 bg-white/5 p-4 rounded-lg">
                  <p className="font-medium mb-2">Tips for adding shows:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Include the venue name and location for clarity</li>
                    <li>• Use descriptive titles like "Open Mic Night" or "Comedy Showcase"</li>
                    <li>• Add notes for any special details or requirements</li>
                    <li>• You can always edit or remove shows later from your profile</li>
                  </ul>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddGig;