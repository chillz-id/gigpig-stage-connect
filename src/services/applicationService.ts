
export interface ApplicationData {
  id: string;
  comedian_id: string;
  comedian_name: string;
  comedian_avatar?: string;
  comedian_experience?: string;
  comedian_rating?: number;
  event_id: string;
  event_title: string;
  event_venue: string;
  event_date: string;
  applied_at: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  show_type: string;
}

export interface EventOption {
  id: string;
  title: string;
}

// Mock data - replace with real data from API
export const mockApplications: ApplicationData[] = [
  {
    id: '1',
    comedian_id: '1',
    comedian_name: 'Sarah Mitchell',
    comedian_avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
    comedian_experience: '3 years',
    comedian_rating: 4.2,
    event_id: '1',
    event_title: 'Wednesday Comedy Night',
    event_venue: 'The Laugh Track',
    event_date: '2024-12-20',
    applied_at: '2024-12-18T10:00:00Z',
    status: 'pending',
    message: 'Hi! I\'d love to perform at your show. I have great crowd work skills and clean material.',
    show_type: 'MC',
  },
  {
    id: '2',
    comedian_id: '2',
    comedian_name: 'Mike Chen',
    comedian_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    comedian_experience: '2 years',
    comedian_rating: 4.5,
    event_id: '1',
    event_title: 'Wednesday Comedy Night',
    event_venue: 'The Laugh Track',
    event_date: '2024-12-20',
    applied_at: '2024-12-17T15:30:00Z',
    status: 'accepted',
    message: 'Looking forward to a great show! I have solid 5-minute set ready.',
    show_type: 'Headliner',
  },
  {
    id: '3',
    comedian_id: '3',
    comedian_name: 'Emma Wilson',
    comedian_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    comedian_experience: '1 year',
    comedian_rating: 4.0,
    event_id: '2',
    event_title: 'Friday Headliner Showcase',
    event_venue: 'Comedy Central Club',
    event_date: '2024-12-22',
    applied_at: '2024-12-15T09:15:00Z',
    status: 'declined',
    message: 'Hi, I\'m relatively new but very passionate. Would love the opportunity!',
    show_type: 'MC',
  },
];

export const mockEvents: EventOption[] = [
  { id: '1', title: 'Wednesday Comedy Night' },
  { id: '2', title: 'Friday Headliner Showcase' },
];

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
export const calculateApplicationStats = (applications: ApplicationData[]) => {
  return {
    mc: applications.filter(app => app.show_type === 'MC').length,
    headliner: applications.filter(app => app.show_type === 'Headliner').length,
    unread: applications.filter(app => app.status === 'pending').length,
  };
};
