import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Repeat, Loader2, Trash2, Save, Send } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { EventBannerUpload } from '@/components/gigs/EventBannerUpload';
import { RecurringGigPicker, CustomDateWithTime } from '@/components/gigs/RecurringGigPicker';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { EventStatus } from '@/types/events.unified';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FormData {
  title: string;
  venue_name: string;
  venue_address: string;
  city: string;
  state: string;
  country: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  description: string;
  ticket_link: string;
  banner_url: string;
  is_recurring: boolean;
  recurrence_pattern: 'weekly' | 'monthly' | 'custom';
  recurrence_frequency: number;
  recurrence_day_of_week?: number;
  recurrence_day_of_month?: number;
  recurrence_end_date?: Date;
  recurrence_custom_dates: CustomDateWithTime[];
}

const initialFormData: FormData = {
  title: '',
  venue_name: '',
  venue_address: '',
  city: '',
  state: '',
  country: 'Australia',
  start_date: '',
  start_time: '19:00',
  end_date: '',
  end_time: '21:00',
  description: '',
  ticket_link: '',
  banner_url: '',
  is_recurring: false,
  recurrence_pattern: 'weekly',
  recurrence_frequency: 1,
  recurrence_day_of_week: undefined,
  recurrence_day_of_month: undefined,
  recurrence_end_date: undefined,
  recurrence_custom_dates: [],
};

export default function CreateOrganizationEvent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const { theme } = useTheme();
  const { toast } = useToast();

  const orgSlug = organization?.url_slug;
  const draftId = searchParams.get('draft');

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load draft if editing
  useEffect(() => {
    if (draftId && organization?.id) {
      loadDraft(draftId);
    }
  }, [draftId, organization?.id]);

  const loadDraft = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization?.id)
        .eq('status', EventStatus.DRAFT)
        .single();

      if (error) throw error;

      if (data) {
        // Parse event_date to get date and time
        const eventDate = data.event_date ? new Date(data.event_date) : null;

        setFormData({
          title: data.title || '',
          venue_name: data.venue || '',
          venue_address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || 'Australia',
          start_date: eventDate ? format(eventDate, 'yyyy-MM-dd') : '',
          start_time: data.start_time || '19:00',
          end_date: eventDate ? format(eventDate, 'yyyy-MM-dd') : '',
          end_time: data.end_time || '21:00',
          description: data.description || '',
          ticket_link: data.ticket_url || '',
          banner_url: data.banner_url || '',
          is_recurring: data.is_recurring || false,
          recurrence_pattern: (data.recurrence_pattern as 'weekly' | 'monthly' | 'custom') || 'weekly',
          recurrence_frequency: 1,
          recurrence_day_of_week: undefined,
          recurrence_day_of_month: undefined,
          recurrence_end_date: data.recurrence_end_date ? new Date(data.recurrence_end_date) : undefined,
          recurrence_custom_dates: [],
        });
        setCurrentDraftId(id);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to load draft. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!organization?.id || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      autoSave();
    }, 3000);

    return () => clearTimeout(timer);
  }, [formData, hasUnsavedChanges, organization?.id]);

  const autoSave = async () => {
    if (!organization?.id) return;

    // Don't auto-save if form is empty
    if (!formData.title.trim() && !formData.venue_name.trim()) return;

    setAutoSaveStatus('saving');

    try {
      const eventData = buildEventData();

      if (currentDraftId) {
        // Update existing draft
        const { error } = await supabase
          .from('events')
          .update({
            ...eventData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentDraftId)
          .eq('organization_id', organization.id);

        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('events')
          .insert({
            ...eventData,
            organization_id: organization.id,
            status: EventStatus.DRAFT,
          })
          .select('id')
          .single();

        if (error) throw error;
        setCurrentDraftId(data.id);
      }

      setAutoSaveStatus('saved');
      setHasUnsavedChanges(false);

      // Reset status after a delay
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('idle');
    }
  };

  const buildEventData = () => {
    // Build event date with time
    let eventDate = null;
    if (formData.start_date) {
      eventDate = new Date(`${formData.start_date}T${formData.start_time}:00`).toISOString();
    }

    return {
      title: formData.title.trim() || null,
      venue: formData.venue_name.trim() || null,
      address: formData.venue_address.trim() || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || 'Australia',
      event_date: eventDate,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      description: formData.description.trim() || null,
      ticket_url: formData.ticket_link.trim() || null,
      banner_url: formData.banner_url || null,
      is_recurring: formData.is_recurring,
      recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
      recurrence_end_date: formData.recurrence_end_date?.toISOString() || null,
    };
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAddressSelect = (address: string, placeDetails?: any) => {
    handleInputChange('venue_address', address);

    // Extract city and state from place details
    if (placeDetails?.address_components) {
      const components = placeDetails.address_components;

      const city = components.find((c: any) =>
        c.types.includes('locality')
      )?.long_name;

      const state = components.find((c: any) =>
        c.types.includes('administrative_area_level_1')
      )?.short_name;

      if (city) handleInputChange('city', city);
      if (state) handleInputChange('state', state);
    }
  };

  const isFormValid = () => {
    return (
      formData.banner_url.trim() &&
      formData.title.trim() &&
      formData.venue_name.trim() &&
      formData.venue_address.trim() &&
      formData.start_date &&
      formData.start_time &&
      formData.end_date &&
      formData.end_time &&
      formData.ticket_link.trim()
    );
  };

  const getEventsToCreate = (): Array<{ date: Date; startTime: string; endTime: string }> => {
    if (!formData.is_recurring) {
      // Single event
      return [{
        date: new Date(`${formData.start_date}T${formData.start_time}`),
        startTime: formData.start_time,
        endTime: formData.end_time,
      }];
    }

    if (formData.recurrence_pattern === 'custom' && formData.recurrence_custom_dates.length > 0) {
      // Custom dates with per-date times
      return formData.recurrence_custom_dates.map(cd => ({
        date: cd.date,
        startTime: cd.startTime,
        endTime: cd.endTime,
      }));
    }

    // For weekly/monthly, we'd need to generate dates based on pattern
    // For now, just use the start date
    return [{
      date: new Date(`${formData.start_date}T${formData.start_time}`),
      startTime: formData.start_time,
      endTime: formData.end_time,
    }];
  };

  const handlePublish = async () => {
    if (!organization?.id) return;

    if (!isFormValid()) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields before publishing.',
        variant: 'destructive',
      });
      return;
    }

    setIsPublishing(true);

    try {
      const eventsToCreate = getEventsToCreate();

      // Create events
      const eventPromises = eventsToCreate.map(async (event) => {
        const eventData = {
          organization_id: organization.id,
          title: formData.title.trim(),
          venue: formData.venue_name.trim(),
          address: formData.venue_address.trim(),
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || 'Australia',
          event_date: event.date.toISOString(),
          start_time: event.startTime,
          end_time: event.endTime,
          description: formData.description.trim() || null,
          ticket_url: formData.ticket_link.trim(),
          banner_url: formData.banner_url,
          status: EventStatus.OPEN,
          is_recurring: formData.is_recurring && eventsToCreate.length > 1,
        };

        const { error } = await supabase.from('events').insert(eventData);
        if (error) throw error;
      });

      await Promise.all(eventPromises);

      // Delete the draft if exists
      if (currentDraftId) {
        await supabase.from('events').delete().eq('id', currentDraftId);
      }

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['organization-events'] });

      toast({
        title: 'Success',
        description: eventsToCreate.length > 1
          ? `${eventsToCreate.length} shows have been published.`
          : 'Your show has been published.',
      });

      navigate(`/org/${orgSlug}/events`);
    } catch (error: any) {
      console.error('Error publishing event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!organization?.id) return;

    setIsSavingDraft(true);

    try {
      const eventData = buildEventData();

      if (currentDraftId) {
        const { error } = await supabase
          .from('events')
          .update({
            ...eventData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentDraftId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert({
            ...eventData,
            organization_id: organization.id,
            status: EventStatus.DRAFT,
          })
          .select('id')
          .single();

        if (error) throw error;
        setCurrentDraftId(data.id);
      }

      setHasUnsavedChanges(false);

      toast({
        title: 'Draft Saved',
        description: 'Your event has been saved as a draft.',
      });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDelete = async () => {
    if (!currentDraftId) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', currentDraftId);

      if (error) throw error;

      toast({
        title: 'Draft Deleted',
        description: 'Your draft has been deleted.',
      });

      navigate(`/org/${orgSlug}/events`);
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete draft. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

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

  if (!organization) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Organization Not Found</h1>
      </div>
    );
  }

  const eventsCount = getEventsToCreate().length;
  const publishButtonText = eventsCount > 1 ? 'Publish Shows' : 'Publish Show';

  return (
    <div className={cn('min-h-screen', getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                onClick={() => navigate(`/org/${orgSlug}/events`)}
                className="professional-button flex items-center gap-2"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-white">
                {currentDraftId ? 'Edit Draft' : 'Create Event'}
              </h1>
            </div>

            {/* Auto-save status */}
            {autoSaveStatus !== 'idle' && (
              <div className="text-sm text-gray-300 flex items-center gap-2">
                {autoSaveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="text-green-400">Draft saved</span>
                )}
              </div>
            )}
          </div>

          {/* Form */}
          <Card className={cn(getCardStyles(), 'text-white')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-6 h-6 text-purple-400" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handlePublish(); }} className="space-y-6">
                {/* Event Banner - REQUIRED */}
                <div>
                  <Label className="text-white">Event Banner *</Label>
                  <EventBannerUpload
                    onBannerSelected={(url) => handleInputChange('banner_url', url)}
                    currentBannerUrl={formData.banner_url}
                  />
                  {!formData.banner_url && (
                    <p className="text-xs text-red-400 mt-1">
                      Event banner is required
                    </p>
                  )}
                </div>

                {/* Show Title - REQUIRED */}
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

                {/* Venue Name - REQUIRED */}
                <div>
                  <Label htmlFor="venue_name" className="text-white">Venue Name *</Label>
                  <Input
                    id="venue_name"
                    value={formData.venue_name}
                    onChange={(e) => handleInputChange('venue_name', e.target.value)}
                    placeholder="e.g., The Comedy Store Sydney"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    required
                  />
                </div>

                {/* Venue Address - REQUIRED with Google Places */}
                <div>
                  <Label htmlFor="venue_address" className="text-white">Venue Address *</Label>
                  <AddressAutocomplete
                    onAddressSelect={handleAddressSelect}
                    placeholder="Start typing address..."
                    defaultValue={formData.venue_address}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                  />
                </div>

                {/* Start Date and Time - REQUIRED */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date" className="text-white">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => {
                        handleInputChange('start_date', e.target.value);
                        // Also set end date if not set
                        if (!formData.end_date) {
                          handleInputChange('end_date', e.target.value);
                        }
                      }}
                      className="bg-white/10 border-white/20 text-white"
                      min={format(new Date(), 'yyyy-MM-dd')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_time" className="text-white">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                {/* End Date and Time - REQUIRED */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="end_date" className="text-white">End Date *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange('end_date', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      min={formData.start_date || format(new Date(), 'yyyy-MM-dd')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time" className="text-white">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      required
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

                {/* Ticket Link - REQUIRED */}
                <div>
                  <Label htmlFor="ticket_link" className="text-white">Ticket Link *</Label>
                  <Input
                    id="ticket_link"
                    type="url"
                    value={formData.ticket_link}
                    onChange={(e) => handleInputChange('ticket_link', e.target.value)}
                    placeholder="https://humanitix.com/... or https://eventbrite.com/..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    required
                  />
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
                        Set up multiple dates for this event
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                  />
                </div>

                {/* Recurring Pattern Picker */}
                {formData.is_recurring && (
                  <RecurringGigPicker
                    pattern={formData.recurrence_pattern}
                    onPatternChange={(pattern) => handleInputChange('recurrence_pattern', pattern)}
                    frequency={formData.recurrence_frequency}
                    onFrequencyChange={(freq) => handleInputChange('recurrence_frequency', freq)}
                    dayOfWeek={formData.recurrence_day_of_week}
                    onDayOfWeekChange={(day) => handleInputChange('recurrence_day_of_week', day)}
                    dayOfMonth={formData.recurrence_day_of_month}
                    onDayOfMonthChange={(day) => handleInputChange('recurrence_day_of_month', day)}
                    customDates={formData.recurrence_custom_dates}
                    onCustomDatesChange={(dates) => handleInputChange('recurrence_custom_dates', dates)}
                    defaultStartTime={formData.start_time}
                    defaultEndTime={formData.end_time}
                    enablePerDateTimes={true}
                    endDate={formData.recurrence_end_date}
                    onEndDateChange={(date) => handleInputChange('recurrence_end_date', date)}
                  />
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {/* Delete button - only for existing drafts */}
                  {currentDraftId && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting}
                      className="flex items-center gap-2"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </Button>
                  )}

                  <div className="flex-1" />

                  {/* Save Draft */}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft}
                    className="flex items-center gap-2"
                  >
                    {isSavingDraft ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Draft
                  </Button>

                  {/* Publish */}
                  <Button
                    type="submit"
                    disabled={!isFormValid() || isPublishing}
                    className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                  >
                    {isPublishing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {isPublishing ? 'Publishing...' : publishButtonText}
                  </Button>
                </div>

                {/* Form validation hint */}
                {!isFormValid() && (
                  <div className="text-sm text-yellow-400 bg-yellow-400/10 p-3 rounded-lg">
                    Please complete all required fields (*) before publishing.
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this draft. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
