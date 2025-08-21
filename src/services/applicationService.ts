
import { ApplicationData, ApplicationStats, ApplicationFilters } from '@/types/application';
import { supabase } from '@/integrations/supabase/client';

export interface EventOption {
  id: string;
  title: string;
}

// Real database functions
export async function getApplicationsByPromoter(promoterId: string): Promise<ApplicationData[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      id,
      comedian_id,
      event_id,
      status,
      message,
      spot_type,
      availability_confirmed,
      requirements_acknowledged,
      applied_at,
      responded_at,
      events!inner (
        id,
        title,
        venue,
        event_date,
        promoter_id
      ),
      profiles!comedian_id (
        id,
        name,
        avatar_url,
        bio,
        years_experience
      )
    `)
    .eq('events.promoter_id', promoterId)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }

  return (data || []).map(app => ({
    id: app.id,
    comedian_id: app.comedian_id,
    comedian_name: app.profiles?.name || 'Unknown',
    comedian_avatar: app.profiles?.avatar_url,
    comedian_experience: app.profiles?.years_experience ? `${app.profiles.years_experience} years` : undefined,
    comedian_rating: undefined, // Not available in current schema
    event_id: app.event_id,
    event_title: app.events?.title || 'Unknown Event',
    event_venue: app.events?.venue || 'Unknown Venue',
    event_date: app.events?.event_date || '',
    applied_at: app.applied_at || '',
    status: app.status || 'pending',
    message: app.message,
    spot_type: app.spot_type,
    availability_confirmed: app.availability_confirmed,
    requirements_acknowledged: app.requirements_acknowledged,
  }));
}

export async function getEventOptions(promoterId: string): Promise<EventOption[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title')
    .eq('promoter_id', promoterId)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data || [];
}

// Helper function to parse experience years
export const getExperienceYears = (experience: string) => {
  const match = experience.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

// Filter and sort applications
export const filterAndSortApplications = (
  applications: ApplicationData[],
  searchTerm: string,
  eventFilter: string,
  sortBy: string,
  dateRange: { from: Date | undefined; to: Date | undefined }
) => {
  return applications
    .filter(app => {
      const matchesSearch = app.comedian_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.event_title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEvent = eventFilter === 'all' || app.event_id === eventFilter;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRange.from || dateRange.to) {
        const appliedDate = new Date(app.applied_at);
        if (dateRange.from && appliedDate < dateRange.from) matchesDateRange = false;
        if (dateRange.to && appliedDate > dateRange.to) matchesDateRange = false;
      }
      
      return matchesSearch && matchesEvent && matchesDateRange;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'applied_at_desc':
          return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
        case 'applied_at_asc':
          return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
        case 'comedian_name':
          return a.comedian_name.localeCompare(b.comedian_name);
        case 'event_date':
          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        case 'most_experienced':
          return getExperienceYears(b.comedian_experience || '0') - getExperienceYears(a.comedian_experience || '0');
        default:
          return 0;
      }
    });
};

// Calculate stats
export const calculateApplicationStats = (applications: ApplicationData[]): ApplicationStats => {
  return {
    mc: applications.filter(app => app.spot_type?.toLowerCase() === 'mc').length,
    feature: applications.filter(app => app.spot_type?.toLowerCase() === 'feature').length,
    headline: applications.filter(app => app.spot_type?.toLowerCase() === 'headline' || app.spot_type?.toLowerCase() === 'headliner').length,
    spot: applications.filter(app => app.spot_type?.toLowerCase() === 'spot').length,
    pending: applications.filter(app => app.status === 'pending').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected' || app.status === 'declined').length,
    unread: applications.filter(app => app.status === 'pending').length,
    total: applications.length,
  };
};

// Get display name for spot type
export const getSpotTypeDisplayName = (spotType: string | null | undefined): string => {
  if (!spotType) return 'Open Spot';
  
  const displayNames: Record<string, string> = {
    'mc': 'MC',
    'spot': 'Spot',
    'feature': 'Feature',
    'headline': 'Headline',
    'headliner': 'Headliner'
  };
  
  return displayNames[spotType.toLowerCase()] || spotType;
};

// Get status badge color
export const getStatusBadgeColor = (status: string | null | undefined): string => {
  const statusColors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'accepted': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'declined': 'bg-red-100 text-red-800',
    'withdrawn': 'bg-gray-100 text-gray-800'
  };
  
  return statusColors[status || 'pending'] || 'bg-gray-100 text-gray-800';
};

// Validate application data
export const validateApplicationData = (data: Partial<ApplicationSubmitData>): string[] => {
  const errors: string[] = [];
  
  if (!data.event_id) {
    errors.push('Event ID is required');
  }
  
  if (data.message && data.message.length > 1000) {
    errors.push('Message must be less than 1000 characters');
  }
  
  return errors;
};

export interface ApplicationSubmitData {
  event_id: string;
  message?: string;
  spot_type?: string;
  availability_confirmed?: boolean;
  requirements_acknowledged?: boolean;
}
