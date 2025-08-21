
import { EventFormData, RecurringSettings, EventSpot } from '@/types/eventTypes';
import { Tables } from '@/integrations/supabase/types';

type EventTemplate = Tables<'event_templates'>;

interface TemplateData {
  title?: string;
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  time?: string;
  endTime?: string;
  type?: string;
  spots?: number | EventSpot[];
  description?: string;
  requirements?: string[];
  isVerifiedOnly?: boolean;
  isPaid?: boolean;
  allowRecording?: boolean;
  ageRestriction?: string;
  dresscode?: string;
  imageUrl?: string;
  bannerUrl?: string; // Support both naming conventions
  showLevel?: string;
  showType?: string;
  customShowType?: string;
  ticketingType?: string;
  externalTicketUrl?: string;
  tickets?: any[];
  feeHandling?: string;
  capacity?: number;
  recurringSettings?: any;
}

export const loadTemplateData = (
  template: EventTemplate,
  setFormData: (data: EventFormData) => void,
  setEventSpots: (spots: EventSpot[]) => void,
  setRecurringSettings: (settings: RecurringSettings) => void,
  currentImageUrl?: string
) => {
  try {
    const data = template.template_data as TemplateData;
    
    // Handle both imageUrl and bannerUrl for backward compatibility
    const templateBannerUrl = data.imageUrl || data.bannerUrl || '';
    
    // Preserve current banner if exists, otherwise use template banner
    const preservedBannerUrl = currentImageUrl || templateBannerUrl;
    
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
      spots: Array.isArray(data.spots) ? data.spots.length : (data.spots || 5),
      description: data.description || '',
      requirements: Array.isArray(data.requirements) ? data.requirements : [],
      isVerifiedOnly: Boolean(data.isVerifiedOnly),
      isPaid: Boolean(data.isPaid),
      allowRecording: Boolean(data.allowRecording),
      ageRestriction: data.ageRestriction || '18+',
      dresscode: data.dresscode || 'Casual',
      imageUrl: preservedBannerUrl, // Preserve current banner or use template banner
      showLevel: data.showLevel || '',
      showType: data.showType || '',
      customShowType: data.customShowType || '',
      ticketingType: data.ticketingType || 'gigpigs',
      externalTicketUrl: data.externalTicketUrl || '',
      tickets: Array.isArray(data.tickets) ? data.tickets : [],
      feeHandling: data.feeHandling || 'absorb',
      capacity: data.capacity || 0,
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
  } catch (error) {
    console.error('Error loading template data:', error);
    // Don't throw error, just log it - let components handle UI feedback
    // Template will load with default values
  }
};
