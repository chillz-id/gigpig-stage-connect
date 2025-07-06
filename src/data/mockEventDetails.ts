export interface MockEventDetail {
  id: string;
  title: string;
  venue: string;
  city: string;
  state: string;
  address: string;
  event_date: string;
  start_time: string;
  end_time: string;
  description: string;
  full_description: string;
  type: string;
  show_type: string;
  age_restriction: string;
  is_paid: boolean;
  is_verified_only: boolean;
  spots: number;
  applied_spots: number;
  status: 'published' | 'draft' | 'cancelled';
  allow_recording: boolean;
  dress_code: string;
  banner_url?: string;
  requirements?: string;
  capacity: number;
  ticketing_type: 'none' | 'external' | 'internal';
  external_ticket_url?: string;
  tickets?: Array<{
    type: string;
    price: number;
    available: number;
    description: string;
  }>;
  promoter: {
    id: string;
    name: string;
    avatar_url?: string;
    bio: string;
  };
  event_spots: Array<{
    id: string;
    spot_name: string;
    is_paid: boolean;
    payment_amount?: number;
    duration_minutes?: number;
    description?: string;
  }>;
  venue_details: {
    description: string;
    amenities: string[];
    parking: string;
    accessibility: string;
  };
  submission_guidelines: string[];
  what_to_expect: string[];
  customer_what_to_expect?: string[];
  networking_opportunities: string[];
}

export const mockEventDetails: MockEventDetail[] = [
  {
    id: 'mock-1',
    title: 'Mid-Year Comedy Kickoff',
    venue: 'The Laugh Track',
    city: 'Sydney',
    state: 'NSW',
    address: '123 Comedy Street, Sydney NSW 2000',
    event_date: '2025-07-02',
    start_time: '8:00 PM',
    end_time: '10:00 PM',
    description: 'Mid-year comedy celebration featuring top comedians from across Australia.',
    full_description: `Join us for our spectacular Mid-Year Comedy Kickoff at The Laugh Track! This premium comedy event brings together Australia's finest comedians for an unforgettable night of laughter and entertainment.

This exclusive show features carefully curated acts from established comedians who have proven themselves in the comedy circuit. Each performer brings their unique style and perspective, creating a diverse and engaging show that will keep you laughing all night long.

The Laugh Track provides an intimate setting with excellent sightlines and acoustics, ensuring every joke lands perfectly. Our full bar and kitchen will be open throughout the evening, offering craft cocktails and gourmet bar snacks.

This is a celebration of everything great about Australian comedy - don't miss your chance to be part of this special event!`,
    type: 'Mixed',
    show_type: 'Professional Showcase',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: true,
    spots: 8,
    applied_spots: 3,
    status: 'published',
    allow_recording: false,
    dress_code: 'Smart Casual',
    banner_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=400&fit=crop',
    requirements: 'Comedian Pro members only - must have performed at least 50 professional gigs',
    capacity: 120,
    ticketing_type: 'external',
    external_ticket_url: 'https://www.eventbrite.com/e/mid-year-comedy-kickoff',
    promoter: {
      id: 'promoter-1',
      name: 'Sarah Chen',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      bio: 'Sarah has been promoting comedy events in Sydney for over 8 years, specializing in high-quality professional showcases. Known for creating inclusive environments where both comedians and audiences thrive.'
    },
    event_spots: [
      { id: 'spot-1', spot_name: 'Opening Act', is_paid: true, payment_amount: 150, duration_minutes: 8, description: 'High-energy opener to set the tone' },
      { id: 'spot-2', spot_name: 'Feature Act 1', is_paid: true, payment_amount: 250, duration_minutes: 15, description: 'Established comedian, strong 15-minute set' },
      { id: 'spot-3', spot_name: 'Feature Act 2', is_paid: true, payment_amount: 250, duration_minutes: 15, description: 'Established comedian, strong 15-minute set' },
      { id: 'spot-4', spot_name: 'Co-Headliner', is_paid: true, payment_amount: 400, duration_minutes: 20, description: 'Experienced professional with TV/festival credits' },
      { id: 'spot-5', spot_name: 'Headliner', is_paid: true, payment_amount: 600, duration_minutes: 25, description: 'Top-tier comedian with strong following' },
      { id: 'spot-6', spot_name: 'MC', is_paid: true, payment_amount: 200, duration_minutes: 0, description: 'Experienced MC to host the entire show' }
    ],
    venue_details: {
      description: 'The Laugh Track is Sydney\'s premier comedy venue, featuring a dedicated comedy theatre with tiered seating and professional lighting.',
      amenities: ['Full bar', 'Kitchen serving until 9:30 PM', 'Coat check', 'Merchandise area'],
      parking: 'Paid street parking available. Wilson Parking garage 2 blocks away.',
      accessibility: 'Wheelchair accessible venue with accessible restrooms and seating areas.'
    },
    submission_guidelines: [
      'Submit a 3-minute video of your strongest material',
      'Include your comedy resume with notable credits',
      'Provide 3 professional references from other promoters',
      'Must be available for sound check at 7:00 PM',
      'All material must be original and appropriate for 18+ audience'
    ],
    what_to_expect: [
      'Professional lighting and sound system',
      'Green room with refreshments for performers',
      'Networking opportunities with industry professionals',
      'Professional photographer capturing moments',
      'Post-show meet and greet with audience members'
    ],
    customer_what_to_expect: [
      'Top-tier comedy performances by established comedians',
      'Intimate venue with excellent sightlines from every seat',
      'Full bar service with craft cocktails and local beers',
      'Gourmet bar snacks available throughout the show',
      'Photo opportunities with performers after the show'
    ],
    networking_opportunities: [
      'Meet other professional comedians',
      'Connect with comedy promoters and bookers',
      'Industry mixer after the show',
      'Opportunity to discuss future collaborations'
    ]
  },
  {
    id: 'mock-2',
    title: 'Melbourne Open Mic Night',
    venue: 'Brew & Laugh Cafe',
    city: 'Melbourne',
    state: 'VIC',
    address: '456 Laughter Lane, Melbourne VIC 3000',
    event_date: '2025-07-05',
    start_time: '7:30 PM',
    end_time: '9:30 PM',
    description: 'Weekly open mic night for new and experienced comedians to test their material.',
    full_description: `Welcome to Melbourne's friendliest open mic night! Every Saturday at Brew & Laugh Cafe, we provide a supportive environment for comedians of all levels to try new material, build confidence, and connect with the local comedy community.

Whether you're stepping on stage for the first time or you're a seasoned pro testing new jokes, our audience is encouraging and our atmosphere is relaxed. We believe in fostering growth and creativity in a judgment-free zone.

The cafe setting creates an intimate, conversational feel that's perfect for developing your stage presence. Our regular attendees include fellow comedians, comedy fans, and supportive friends and family members.

Spots are allocated on a first-come, first-served basis when you arrive. We encourage performers to stay for the entire show to support their fellow comedians. This is community comedy at its best!`,
    type: 'Open Mic',
    show_type: 'Open Mic',
    age_restriction: 'All Ages',
    is_paid: false,
    is_verified_only: false,
    spots: 12,
    applied_spots: 8,
    status: 'published',
    allow_recording: true,
    dress_code: 'Casual',
    banner_url: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=400&fit=crop',
    capacity: 50,
    ticketing_type: 'none',
    promoter: {
      id: 'promoter-2',
      name: 'Marcus Thompson',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Marcus is a working comedian and open mic host who believes in nurturing new talent. He started this weekly open mic to give back to the community that supported his own comedy journey.'
    },
    event_spots: [
      { id: 'spot-1', spot_name: 'Open Mic Slot', is_paid: false, duration_minutes: 5, description: 'First-time performers welcome' },
      { id: 'spot-2', spot_name: 'Open Mic Slot', is_paid: false, duration_minutes: 5, description: 'First-time performers welcome' },
      { id: 'spot-3', spot_name: 'Open Mic Slot', is_paid: false, duration_minutes: 5, description: 'First-time performers welcome' },
      { id: 'spot-4', spot_name: 'Open Mic Slot', is_paid: false, duration_minutes: 5, description: 'First-time performers welcome' },
      { id: 'spot-5', spot_name: 'Open Mic Slot', is_paid: false, duration_minutes: 5, description: 'First-time performers welcome' },
      { id: 'spot-6', spot_name: 'Open Mic Slot', is_paid: false, duration_minutes: 5, description: 'First-time performers welcome' },
      { id: 'spot-7', spot_name: 'Featured Spot', is_paid: false, duration_minutes: 10, description: 'For experienced open micers' },
      { id: 'spot-8', spot_name: 'Guest Feature', is_paid: false, duration_minutes: 15, description: 'Invited local comedian' }
    ],
    venue_details: {
      description: 'Cozy cafe setting with a small stage area and intimate seating. Known for great coffee and a welcoming atmosphere.',
      amenities: ['Full cafe menu', 'Excellent coffee', 'Free Wi-Fi', 'Casual seating'],
      parking: 'Street parking available. Tram stop directly outside.',
      accessibility: 'Ground floor venue with accessible entrance and restroom facilities.'
    },
    submission_guidelines: [
      'No submission required - just show up!',
      'Put your name on the list when you arrive',
      'Maximum 5 minutes for first-time performers',
      'Keep material appropriate for all ages',
      'Be respectful and supportive of other performers'
    ],
    what_to_expect: [
      'Supportive audience of comedy fans and fellow performers',
      'Basic PA system with handheld microphone',
      'Relaxed, cafe atmosphere',
      'Opportunity to try new material in a safe space',
      'Feedback and encouragement from experienced comedians'
    ],
    customer_what_to_expect: [
      'Discover fresh new comedy talent in a relaxed setting',
      'Support emerging comedians in their development',
      'Enjoy great coffee and light meals during the show',
      'Family-friendly atmosphere welcoming to all ages',
      'Interactive, intimate comedy experience'
    ],
    networking_opportunities: [
      'Meet other aspiring comedians',
      'Get advice from experienced performers',
      'Learn about other comedy opportunities in Melbourne',
      'Build lasting friendships in the comedy community'
    ]
  },
  {
    id: 'mock-3',
    title: 'Brisbane Professional Showcase',
    venue: 'The Comedy Corner',
    city: 'Brisbane',
    state: 'QLD',
    address: '789 Funny Street, Brisbane QLD 4000',
    event_date: '2025-07-08',
    start_time: '8:30 PM',
    end_time: '11:00 PM',
    description: 'Professional comedy showcase featuring established comedians.',
    full_description: `Experience Brisbane's finest comedy talent at The Comedy Corner's monthly Professional Showcase. This curated event features only established comedians who have proven themselves in the professional circuit.

Each performer brings polished material and professional stage presence, ensuring a high-quality entertainment experience from start to finish. This is not a development show - every act has been carefully selected for their ability to deliver consistent laughs and engage audiences.

The Comedy Corner provides the perfect setting with professional-grade sound and lighting systems, comfortable seating, and excellent sightlines throughout the venue. Our full bar features local craft beers and signature cocktails.

This showcase represents the best of Brisbane's comedy scene and often features surprise guest appearances from touring comedians. Whether you're a comedy enthusiast or new to the scene, you're guaranteed a memorable night of professional entertainment.`,
    type: 'Professional',
    show_type: 'Professional Showcase',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: false,
    spots: 6,
    applied_spots: 4,
    status: 'published',
    allow_recording: false,
    dress_code: 'Smart Casual',
    banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop',
    capacity: 80,
    ticketing_type: 'internal',
    tickets: [
      { type: 'General Admission', price: 35, available: 60, description: 'Standard seating, great views' },
      { type: 'Premium', price: 50, available: 20, description: 'Front row seating, complimentary drink' }
    ],
    promoter: {
      id: 'promoter-3',
      name: 'Jessica Walsh',
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'Jessica has been a key figure in Brisbane\'s comedy scene for over 6 years. She focuses on showcasing professional comedians and has helped launch several careers through her quality events.'
    },
    event_spots: [
      { id: 'spot-1', spot_name: 'Opening Feature', is_paid: true, payment_amount: 300, duration_minutes: 15, description: 'Strong opener with professional credits' },
      { id: 'spot-2', spot_name: 'Middle Feature', is_paid: true, payment_amount: 350, duration_minutes: 18, description: 'Experienced professional comedian' },
      { id: 'spot-3', spot_name: 'Co-Headliner', is_paid: true, payment_amount: 500, duration_minutes: 22, description: 'Established comedian with strong following' },
      { id: 'spot-4', spot_name: 'Headliner', is_paid: true, payment_amount: 700, duration_minutes: 25, description: 'Top-tier professional comedian' },
      { id: 'spot-5', spot_name: 'MC', is_paid: true, payment_amount: 250, duration_minutes: 0, description: 'Professional MC to host the show' }
    ],
    venue_details: {
      description: 'Dedicated comedy venue in the heart of Brisbane with professional lighting, sound, and a reputation for quality shows.',
      amenities: ['Full bar with craft beer selection', 'Bar snacks available', 'Merchandise sales area', 'Photo booth'],
      parking: 'Secure parking garage underneath venue. Street parking also available.',
      accessibility: 'Fully wheelchair accessible with elevator access and designated seating areas.'
    },
    submission_guidelines: [
      'Minimum 2 years professional experience required',
      'Submit professional video reel (minimum 10 minutes)',
      'Provide detailed performance history and notable credits',
      'References from 2 established promoters or venues',
      'Must be available for tech rehearsal at 7:30 PM'
    ],
    what_to_expect: [
      'Professional grade sound and lighting',
      'Dedicated green room with refreshments',
      'Professional photography and videography',
      'Industry networking opportunities',
      'Potential for return bookings at higher rates'
    ],
    networking_opportunities: [
      'Connect with other professional comedians',
      'Meet venue owners and promoters',
      'Industry connections for future bookings',
      'Opportunity to be considered for festival spots'
    ]
  },
  {
    id: 'mock-4',
    title: 'Perth Semi-Pro Comedy Night',
    venue: 'Sunset Lounge',
    city: 'Perth',
    state: 'WA',
    address: '321 Sunset Drive, Perth WA 6000',
    event_date: '2025-07-12',
    start_time: '6:00 PM',
    end_time: '8:30 PM',
    description: 'Semi-professional comedy night for emerging comedians.',
    full_description: `Sunset Lounge presents Perth's premier semi-professional comedy night, designed for comedians who have moved beyond open mics but are still developing their professional skills. This is the perfect stepping stone between amateur and professional comedy.

Our semi-pro night attracts comedians who are serious about their craft and audiences who appreciate quality emerging talent. It's an excellent opportunity to perform longer sets, test new material, and gain experience in a professional environment without the pressure of a full professional showcase.

The relaxed early evening timing makes this show accessible to a broader audience while still maintaining the quality standards expected of semi-professional comedy. Sunset Lounge's intimate setting and excellent acoustics create the perfect environment for comedians to connect with their audience.

This event has become a launching pad for many of Perth's now-professional comedians. We pride ourselves on providing constructive feedback and genuine development opportunities for emerging talent.`,
    type: 'Semi-Pro',
    show_type: 'Semi-Professional',
    age_restriction: '18+',
    is_paid: true,
    is_verified_only: false,
    spots: 10,
    applied_spots: 6,
    status: 'published',
    allow_recording: true,
    dress_code: 'Casual',
    banner_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop',
    capacity: 60,
    ticketing_type: 'internal',
    tickets: [
      { type: 'General Admission', price: 20, available: 55, description: 'Standard seating' },
      { type: 'Comedian Support', price: 15, available: 5, description: 'Discounted tickets for fellow comedians' }
    ],
    promoter: {
      id: 'promoter-4',
      name: 'David Kim',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'David is a working comedian and promoter who understands the challenges of developing as a professional. He created this semi-pro night to bridge the gap between open mics and professional showcases.'
    },
    event_spots: [
      { id: 'spot-1', spot_name: 'Emerging Talent', is_paid: true, payment_amount: 50, duration_minutes: 8, description: 'For comedians transitioning from open mics' },
      { id: 'spot-2', spot_name: 'Emerging Talent', is_paid: true, payment_amount: 50, duration_minutes: 8, description: 'For comedians transitioning from open mics' },
      { id: 'spot-3', spot_name: 'Semi-Pro Feature', is_paid: true, payment_amount: 100, duration_minutes: 12, description: 'Experienced semi-professional comedian' },
      { id: 'spot-4', spot_name: 'Semi-Pro Feature', is_paid: true, payment_amount: 100, duration_minutes: 12, description: 'Experienced semi-professional comedian' },
      { id: 'spot-5', spot_name: 'Feature Act', is_paid: true, payment_amount: 150, duration_minutes: 15, description: 'Strong semi-professional with development potential' },
      { id: 'spot-6', spot_name: 'Co-Headliner', is_paid: true, payment_amount: 200, duration_minutes: 18, description: 'Semi-pro comedian ready for professional circuit' },
      { id: 'spot-7', spot_name: 'MC', is_paid: true, payment_amount: 80, duration_minutes: 0, description: 'Experienced MC/host' }
    ],
    venue_details: {
      description: 'Stylish lounge venue with comfortable seating and great atmosphere. Popular with young professionals and comedy fans.',
      amenities: ['Full bar with cocktail menu', 'Light appetizers available', 'Free Wi-Fi', 'Outdoor smoking area'],
      parking: 'Free parking available in venue lot after 5 PM. Street parking also available.',
      accessibility: 'Wheelchair accessible entrance and restroom facilities available.'
    },
    submission_guidelines: [
      'Minimum 6 months open mic experience required',
      'Submit 5-minute video of recent performance',
      'Provide list of venues where you\'ve performed',
      'Show willingness to take direction and feedback',
      'Must arrive 30 minutes before show start'
    ],
    what_to_expect: [
      'Quality sound system with wireless microphones',
      'Supportive audience of comedy fans',
      'Constructive feedback from experienced performers',
      'Networking with other developing comedians',
      'Potential for return bookings and advancement opportunities'
    ],
    networking_opportunities: [
      'Meet other semi-professional comedians',
      'Connect with local comedy scene veterans',
      'Learn about professional development opportunities',
      'Get advice on career advancement in comedy'
    ]
  },
  {
    id: 'mock-5',
    title: 'Adelaide Open Mic Special',
    venue: 'Adelaide Arts Centre',
    city: 'Adelaide',
    state: 'SA',
    address: '567 Arts Way, Adelaide SA 5000',
    event_date: '2025-07-15',
    start_time: '7:00 PM',
    end_time: '9:00 PM',
    description: 'Special open mic night with extended time slots.',
    full_description: `Adelaide Arts Centre presents a special edition of our popular open mic night, featuring extended time slots and a focus on artistic development. This unique event combines the accessibility of open mic comedy with the production values of a professional show.

Unlike typical 3-5 minute open mic slots, our special edition offers 7-minute slots, allowing performers to develop fuller routines and explore more complex comedic ideas. This format is perfect for comedians who have outgrown basic open mics but aren't quite ready for professional showcases.

The Arts Centre provides a beautiful, professional venue that elevates the open mic experience. Our audience includes fellow comedians, arts enthusiasts, and supporters of emerging talent. The atmosphere is encouraging yet sophisticated.

This monthly special event has become a highlight of Adelaide's comedy calendar, often featuring surprise guest spots from established comedians and providing invaluable stage time for developing performers.`,
    type: 'Open Mic',
    show_type: 'Open Mic Special',
    age_restriction: '16+',
    is_paid: false,
    is_verified_only: false,
    spots: 15,
    applied_spots: 8,
    status: 'published',
    allow_recording: true,
    dress_code: 'Casual',
    banner_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    capacity: 100,
    ticketing_type: 'none',
    promoter: {
      id: 'promoter-5',
      name: 'Rachel Stevens',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      bio: 'Rachel is an arts administrator and comedy enthusiast who believes in providing quality platforms for emerging artists. She curates these special open mic events to bridge the gap between casual and professional comedy.'
    },
    event_spots: [
      { id: 'spot-1', spot_name: 'Extended Open Mic', is_paid: false, duration_minutes: 7, description: 'Extended slot for developing material' },
      { id: 'spot-2', spot_name: 'Extended Open Mic', is_paid: false, duration_minutes: 7, description: 'Extended slot for developing material' },
      { id: 'spot-3', spot_name: 'Extended Open Mic', is_paid: false, duration_minutes: 7, description: 'Extended slot for developing material' },
      { id: 'spot-4', spot_name: 'Extended Open Mic', is_paid: false, duration_minutes: 7, description: 'Extended slot for developing material' },
      { id: 'spot-5', spot_name: 'Extended Open Mic', is_paid: false, duration_minutes: 7, description: 'Extended slot for developing material' },
      { id: 'spot-6', spot_name: 'Extended Open Mic', is_paid: false, duration_minutes: 7, description: 'Extended slot for developing material' },
      { id: 'spot-7', spot_name: 'Featured Performer', is_paid: false, duration_minutes: 12, description: 'For experienced open mic performers' },
      { id: 'spot-8', spot_name: 'Guest Spot', is_paid: false, duration_minutes: 15, description: 'Invited local comedian or special guest' }
    ],
    venue_details: {
      description: 'Beautiful arts centre with professional theatre space, excellent acoustics, and a sophisticated atmosphere.',
      amenities: ['Cafe and bar', 'Art gallery spaces', 'Professional lighting', 'Green room area'],
      parking: 'Free parking available in arts centre lot. Public transport accessible.',
      accessibility: 'Fully accessible venue with ramps, elevators, and designated seating areas.'
    },
    submission_guidelines: [
      'Sign up starts at 6:30 PM on the night',
      'Limited to 15 performers - first come, first served',
      'Material must be appropriate for 16+ audience',
      'Extended 7-minute slots available',
      'Be prepared to be respectful and supportive of other performers'
    ],
    what_to_expect: [
      'Professional theatre setting with stage lighting',
      'Supportive arts community audience',
      'Extended time slots for better material development',
      'Opportunity to perform in a prestigious venue',
      'Potential feedback from guest comedians and industry professionals'
    ],
    networking_opportunities: [
      'Connect with Adelaide\'s arts and comedy communities',
      'Meet other developing comedians',
      'Network with arts centre staff and volunteers',
      'Learn about other performance opportunities in Adelaide'
    ]
  }
];

// Helper function to get event details by ID
export const getEventDetails = (eventId: string): MockEventDetail | undefined => {
  return mockEventDetails.find(event => event.id === eventId);
};

// Helper function to get random related events (excluding the current event)
export const getRelatedEvents = (currentEventId: string, count: number = 3): MockEventDetail[] => {
  const otherEvents = mockEventDetails.filter(event => event.id !== currentEventId);
  return otherEvents.slice(0, count);
};