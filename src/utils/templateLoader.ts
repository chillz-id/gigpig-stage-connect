
import { EventFormData, RecurringSettings, EventSpot } from '@/types/eventTypes';

export const loadTemplateData = (
  template: any,
  setFormData: (data: EventFormData) => void,
  setEventSpots: (spots: EventSpot[]) => void,
  setRecurringSettings: (settings: RecurringSettings) => void
) => {
  const data = template.template_data;
  
  setFormData({
    title: data.title || '',
    venue: data.venue || '',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    country: data.country || 'Australia',
    date: '',
    time: data.time || '',
    endTime: data.endTime || '',
    type: data.type || '',
    spots: data.spots || 5,
    description: data.description || '',
    requirements: data.requirements || [],
    isVerifiedOnly: data.isVerifiedOnly || false,
    isPaid: data.isPaid || false,
    allowRecording: data.allowRecording || false,
    ageRestriction: data.ageRestriction || '18+',
    dresscode: data.dresscode || 'Casual',
    bannerUrl: data.bannerUrl || '',
    showLevel: data.showLevel || '',
    showType: data.showType || '',
    customShowType: data.customShowType || '',
  });
  
  if (data.spots && Array.isArray(data.spots)) {
    setEventSpots(data.spots);
  }
  
  if (data.recurringSettings) {
    setRecurringSettings({
      ...data.recurringSettings,
      customDates: data.recurringSettings.customDates 
        ? data.recurringSettings.customDates.map((customDate: any) => ({
            date: new Date(customDate.date),
            times: customDate.times || [{ startTime: '19:00', endTime: '22:00' }]
          }))
        : []
    });
  }
};
