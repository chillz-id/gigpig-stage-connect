
import { Comedian } from '@/types/comedian';

export const mockComedians: Comedian[] = [
  {
    id: 'mock-1',
    name: 'Sarah Mitchell',
    bio: 'A rising star in the Sydney comedy scene, Sarah Mitchell brings her unique blend of observational humor and storytelling to stages across Australia. With her quick wit and relatable anecdotes about modern life, she has quickly become a favorite among comedy club audiences.\n\nSarah\'s comedy draws from her experiences as a millennial navigating career changes, relationships, and the absurdities of adult life. Her performances are known for their authenticity and her ability to find humor in the most mundane situations.',
    location: 'Sydney, NSW',
    avatar_url: null,
    is_verified: true,
    email: 'sarah.mitchell@email.com',
    created_at: '2021-06-15T10:30:00Z',
    years_experience: 3,
    show_count: 45,
    specialties: ['Observational Comedy', 'Storytelling', 'Millennial Humor'],
    social_media: {
      instagram: '@sarahmitchellcomedy',
      tiktok: '@sarahcomedyaus',
      twitter: '@sarahmcomedy'
    },
    phone: null,
    website_url: null,
    instagram_url: 'https://instagram.com/sarahmitchellcomedy',
    twitter_url: 'https://twitter.com/sarahmcomedy',
    youtube_url: null,
    facebook_url: null,
    tiktok_url: 'https://tiktok.com/@sarahcomedyaus',
    show_contact_in_epk: true
  },
  {
    id: 'mock-2',
    name: 'Marcus Chen',
    bio: 'Marcus Chen is a veteran comedian with over 8 years of experience in the Australian comedy circuit. Known for his sharp political commentary and cultural observations, Marcus brings a unique perspective to contemporary issues.\n\nHis comedy style blends intellectual humor with accessible storytelling, making complex topics both entertaining and thought-provoking. Marcus has performed at numerous comedy festivals and is a regular at Sydney\'s top comedy venues.',
    location: 'Melbourne, VIC',
    avatar_url: null,
    is_verified: true,
    email: 'marcus.chen@email.com',
    created_at: '2016-03-22T14:15:00Z',
    years_experience: 8,
    show_count: 120,
    specialties: ['Political Comedy', 'Cultural Commentary', 'Intellectual Humor'],
    social_media: {
      instagram: '@marcuschencomedy',
      youtube: '@MarcusChenStandUp'
    },
    phone: '+61 2 9876 5432',
    website_url: 'https://marcuschen.com.au',
    instagram_url: 'https://instagram.com/marcuschencomedy',
    twitter_url: null,
    youtube_url: 'https://youtube.com/@MarcusChenStandUp',
    facebook_url: null,
    tiktok_url: null,
    show_contact_in_epk: true
  },
  {
    id: 'mock-3',
    name: 'Emma Rodriguez',
    bio: 'Emma Rodriguez is a dynamic performer who combines stand-up comedy with musical elements. Her energetic stage presence and clever songwriting make her shows unforgettable experiences.\n\nWith a background in both comedy and music, Emma creates unique performances that blur the lines between stand-up and musical theater. She\'s known for her improvisation skills and audience interaction.',
    location: 'Brisbane, QLD',
    avatar_url: null,
    is_verified: false,
    email: 'emma.rodriguez@email.com',
    created_at: '2022-01-10T09:45:00Z',
    years_experience: 2,
    show_count: 28,
    specialties: ['Musical Comedy', 'Improvisation', 'Interactive Performance'],
    social_media: {
      instagram: '@emmarodriguezcomedy',
      youtube: '@EmmaRodriguezMusic'
    },
    phone: null,
    website_url: null,
    instagram_url: 'https://instagram.com/emmarodriguezcomedy',
    twitter_url: null,
    youtube_url: 'https://youtube.com/@EmmaRodriguezMusic',
    facebook_url: null,
    tiktok_url: null,
    show_contact_in_epk: false
  }
];
