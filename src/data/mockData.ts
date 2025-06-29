
export interface Show {
  id: string;
  title: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  type: 'Open Mic' | 'Semi-Pro' | 'Pro' | 'Mixed';
  spots: number;
  appliedSpots: number;
  pay: string;
  duration: string;
  description: string;
  isPaid?: boolean;
  isVerifiedOnly?: boolean;
  promoterId: string;
  promoterName: string;
  requirements?: string[];
  status: 'open' | 'closed' | 'full';
}

export interface Application {
  id: string;
  showId: string;
  showTitle: string;
  venue: string;
  appliedDate: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
}

export interface Event {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  type: string;
  spots: number;
  applications: number;
  revenue?: number;
  status: 'active' | 'draft' | 'completed';
}

export const mockShows: Show[] = [
  {
    id: '1',
    title: 'Wednesday Comedy Night',
    venue: 'The Laugh Track',
    location: 'Sydney, NSW',
    date: '2024-12-20',
    time: '19:30',
    type: 'Open Mic',
    spots: 6,
    appliedSpots: 2,
    pay: 'Free',
    duration: '5 min',
    description: 'Weekly open mic night for new and emerging comedians. Great atmosphere and supportive crowd.',
    promoterId: '1',
    promoterName: 'Comedy Central Venues',
    requirements: ['Clean material only', 'Arrive 30 min early'],
    status: 'open',
  },
  {
    id: '2',
    title: 'Friday Headliner Showcase',
    venue: 'Comedy Central Club',
    location: 'Melbourne, VIC',
    date: '2024-12-22',
    time: '20:00',
    type: 'Pro',
    spots: 4,
    appliedSpots: 1,
    pay: '$150',
    duration: '15 min',
    description: 'Professional showcase featuring established comedians. High-energy crowd and great exposure.',
    isPaid: true,
    isVerifiedOnly: true,
    promoterId: '2',
    promoterName: 'Melbourne Comedy Co.',
    requirements: ['Verified comedians only', 'Professional headshots required'],
    status: 'open',
  },
  {
    id: '3',
    title: 'Saturday Mixed Show',
    venue: 'Riverside Comedy',
    location: 'Brisbane, QLD',
    date: '2024-12-23',
    time: '21:00',
    type: 'Mixed',
    spots: 8,
    appliedSpots: 3,
    pay: 'Split',
    duration: '10 min',
    description: 'Mix of open mic and paid spots with ticket revenue split among performers.',
    promoterId: '3',
    promoterName: 'Brisbane Laughs',
    status: 'open',
  },
  {
    id: '4',
    title: 'New Year\'s Eve Gala',
    venue: 'Grand Theatre',
    location: 'Sydney, NSW',
    date: '2024-12-31',
    time: '21:30',
    type: 'Pro',
    spots: 6,
    appliedSpots: 12,
    pay: '$300',
    duration: '20 min',
    description: 'Premium New Year\'s Eve comedy gala. Formal attire required.',
    isPaid: true,
    isVerifiedOnly: true,
    promoterId: '4',
    promoterName: 'Elite Entertainment',
    requirements: ['Verified comedians only', 'Formal attire', 'Clean material'],
    status: 'full',
  },
];

export const mockApplications: Application[] = [
  {
    id: '1',
    showId: '1',
    showTitle: 'Comedy Night at The Laugh Track',
    venue: 'The Laugh Track',
    appliedDate: '2024-12-18',
    status: 'pending',
  },
  {
    id: '2',
    showId: '5',
    showTitle: 'Open Mic Wednesday',
    venue: 'Local Comedy Hub',
    appliedDate: '2024-12-15',
    status: 'accepted',
    message: 'Great to have you! Please arrive 30 minutes early.',
  },
  {
    id: '3',
    showId: '6',
    showTitle: 'Friday Night Laughs',
    venue: 'Downtown Comedy',
    appliedDate: '2024-12-13',
    status: 'declined',
    message: 'Thanks for applying. We\'ll keep you in mind for future shows.',
  },
];

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Wednesday Comedy Night',
    venue: 'The Laugh Track',
    date: '2024-12-20',
    time: '19:30',
    type: 'Open Mic',
    spots: 6,
    applications: 23,
    status: 'active',
  },
  {
    id: '2',
    title: 'Friday Headliner Showcase',
    venue: 'Comedy Central Club',
    date: '2024-12-22',
    time: '20:00',
    type: 'Pro Show',
    spots: 4,
    applications: 12,
    revenue: 1200,
    status: 'active',
  },
  {
    id: '3',
    title: 'Saturday Night Special',
    venue: 'Downtown Venue',
    date: '2024-12-28',
    time: '20:30',
    type: 'Mixed Show',
    spots: 8,
    applications: 5,
    status: 'draft',
  },
];

export const mockUpcomingGigs = [
  {
    id: '1',
    title: 'Comedy Club Central - Tonight',
    time: '8:00 PM',
    duration: '7 min set',
    pay: '$75',
    venue: 'Comedy Club Central',
  },
  {
    id: '2',
    title: 'Saturday Showcase',
    time: 'Dec 23 • 10 min set',
    duration: '10 min set',
    pay: '$100',
    venue: 'The Comedy Store',
  },
];
