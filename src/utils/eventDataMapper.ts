
import { EventFormData, RecurringSettings, EventSpot } from '@/types/eventTypes';

export const prepareEventData = (
  formData: EventFormData,
  recurringSettings: RecurringSettings,
  eventSpots: EventSpot[],
  userId: string
) => {
  const eventDateTime = new Date(`${formData.date}T${formData.time}`);
  const finalShowType = formData.showType === 'custom' ? formData.customShowType : formData.showType;

  return {
    promoter_id: userId,
    title: formData.title,
    venue: formData.venue,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    country: formData.country,
    event_date: eventDateTime.toISOString(),
    start_time: formData.time,
    end_time: formData.endTime || null,
    type: finalShowType,
    description: formData.description,
    requirements: formData.requirements.join('\n'),
    is_verified_only: formData.isVerifiedOnly,
    is_paid: formData.isPaid,
    allow_recording: formData.allowRecording,
    age_restriction: formData.ageRestriction,
    dress_code: formData.dresscode,
    banner_url: formData.bannerUrl || null,
    capacity: formData.capacity,
    isRecurring: recurringSettings.isRecurring,
    recurrencePattern: recurringSettings.isRecurring ? recurringSettings.pattern : undefined,
    recurrenceEndDate: recurringSettings.isRecurring && recurringSettings.pattern !== 'custom' ? recurringSettings.endDate : undefined,
    customDates: recurringSettings.isRecurring && recurringSettings.pattern === 'custom' ? recurringSettings.customDates : undefined,
    spotDetails: eventSpots,
    showLevel: formData.showLevel,
    showType: finalShowType
  };
};
