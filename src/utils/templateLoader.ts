
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
    date: '', // Always reset date for new events
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
    bannerUrl: '', // Always reset banner URL
    showLevel: data.showLevel || '',
    showType: data.showType || '',
    customShowType: data.customShowType || '',
    ticketingType: data.ticketingType || 'gigpigs',
    externalTicketUrl: data.externalTicketUrl || '',
    tickets: data.tickets || [],
  });
  
  // Load event spots if they exist
  if (data.spots && Array.isArray(data.spots)) {
    setEventSpots(data.spots);
  }
  
  // Load recurring settings if they exist
  if (data.recurringSettings) {
    setRecurringSettings({
      ...data.recurringSettings,
      endDate: '', // Reset end date for new recurring events
      customDates: data.recurringSettings.customDates 
        ? data.recurringSettings.customDates.map((customDate: any) => ({
            date: new Date(customDate.date),
            times: customDate.times || [{ startTime: '19:00', endTime: '22:00' }]
          }))
        : []
    });
  }
};
