
import { Comedian } from '@/types/comedian';

export const mockComedians: Comedian[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    bio: 'Award-winning comedian specializing in observational humor and witty takes on modern life. 5+ years performing at top venues across Sydney.',
    location: 'Sydney CBD, NSW',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b793?w=150&h=150&fit=crop&crop=face',
    is_verified: true,
    email: 'sarah@example.com',
    years_experience: 5,
    show_count: 120,
    specialties: ['Observational', 'Storytelling', 'Crowd Work'],
    social_media: {
      instagram: '@sarahmitchell_comedy',
      tiktok: '@sarahcomedy',
      twitter: '@sarahmitchell',
      youtube: 'Sarah Mitchell Comedy'
    }
  },
  {
    id: '2',
    name: 'Jake Thompson',
    bio: 'High-energy comedian known for his improvisation skills and audience interaction. Regular performer at comedy clubs and festivals.',
    location: 'Newtown, NSW',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    is_verified: true,
    email: 'jake@example.com',
    years_experience: 3,
    show_count: 85,
    specialties: ['Improvisation', 'Crowd Work', 'Physical Comedy'],
    social_media: {
      instagram: '@jakethompsoncomedy',
      twitter: '@jakethompson',
      youtube: 'Jake Thompson Laughs'
    }
  },
  {
    id: '3',
    name: 'Emma Chen',
    bio: 'Rising star in the Sydney comedy scene with a unique blend of cultural humor and sharp social commentary.',
    location: 'Surry Hills, NSW',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    is_verified: true,
    email: 'emma@example.com',
    years_experience: 2,
    show_count: 45,
    specialties: ['Cultural Comedy', 'Social Commentary', 'Storytelling'],
    social_media: {
      instagram: '@emmachen_comedy',
      tiktok: '@emmachencomedy',
      twitter: '@emmachen'
    }
  },
  {
    id: '4',
    name: 'Marcus Williams',
    bio: 'Veteran comedian with over 8 years of experience. Known for his clever wordplay and engaging stage presence.',
    location: 'Bondi Beach, NSW',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    is_verified: true,
    email: 'marcus@example.com',
    years_experience: 8,
    show_count: 200,
    specialties: ['Wordplay', 'Observational', 'Clean Comedy'],
    social_media: {
      instagram: '@marcuswilliamscomedy',
      twitter: '@marcuswilliams',
      youtube: 'Marcus Williams Comedy'
    }
  },
  {
    id: '5',
    name: 'Lisa Rodriguez',
    bio: 'Dynamic performer bringing fresh perspectives to the comedy stage. Specializes in relatable humor about everyday situations.',
    location: 'Darlinghurst, NSW',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    is_verified: true,
    email: 'lisa@example.com',
    years_experience: 4,
    show_count: 95,
    specialties: ['Relatable Humor', 'Storytelling', 'Observational'],
    social_media: {
      instagram: '@lisarodriguezcomedy',
      tiktok: '@lisacomedy',
      twitter: '@lisarodriguez'
    }
  }
];
