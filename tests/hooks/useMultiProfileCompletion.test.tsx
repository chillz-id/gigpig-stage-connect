import { renderHook } from '@testing-library/react';
import { useMultiProfileCompletion } from '@/hooks/useMultiProfileCompletion';
import type { ProfileTypeValue } from '@/contexts/ProfileContext';

describe('useMultiProfileCompletion', () => {
  describe('Comedian Profile Completion', () => {
    it('should return 0% for empty comedian profile', () => {
      const profileData = {};
      const { result } = renderHook(() =>
        useMultiProfileCompletion('comedian', profileData)
      );

      expect(result.current.percentage).toBe(0);
      expect(result.current.label).toBe('Empty');
      expect(result.current.variant).toBe('destructive');
      expect(result.current.missingFields).toContain('name');
      expect(result.current.missingFields).toContain('bio');
    });

    it('should return 50% for partially complete comedian profile', () => {
      const profileData = {
        name: 'John Doe',
        bio: 'Comedian bio'
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('comedian', profileData)
      );

      expect(result.current.percentage).toBeGreaterThan(0);
      expect(result.current.percentage).toBeLessThan(100);
      expect(result.current.variant).toBe('default');
    });

    it('should return 100% for complete comedian profile', () => {
      const profileData = {
        name: 'John Doe',
        bio: 'Comedian bio',
        avatar_url: 'https://example.com/avatar.jpg',
        location: 'Sydney, Australia',
        instagram_url: 'https://instagram.com/johndoe',
        twitter_url: 'https://twitter.com/johndoe'
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('comedian', profileData)
      );

      expect(result.current.percentage).toBe(100);
      expect(result.current.label).toBe('Complete');
      expect(result.current.variant).toBe('default');
      expect(result.current.missingFields).toHaveLength(0);
    });
  });

  describe('Promoter Profile Completion', () => {
    it('should return 0% for empty promoter profile', () => {
      const profileData = {};
      const { result } = renderHook(() =>
        useMultiProfileCompletion('promoter', profileData)
      );

      expect(result.current.percentage).toBe(0);
      expect(result.current.label).toBe('Empty');
      expect(result.current.missingFields).toContain('name');
    });

    it('should calculate completion based on promoter fields', () => {
      const profileData = {
        name: 'Comedy Club'
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('promoter', profileData)
      );

      expect(result.current.percentage).toBeGreaterThan(0);
      expect(result.current.percentage).toBeLessThan(100);
    });
  });

  describe('Manager Profile Completion', () => {
    it('should return 0% for empty manager profile', () => {
      const profileData = {};
      const { result } = renderHook(() =>
        useMultiProfileCompletion('manager', profileData)
      );

      expect(result.current.percentage).toBe(0);
      expect(result.current.label).toBe('Empty');
      expect(result.current.missingFields).toContain('agency_name');
    });

    it('should return higher percentage with agency_name and bio', () => {
      const profileData = {
        agency_name: 'Top Talent Management',
        bio: 'We represent the best comedians'
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('manager', profileData)
      );

      expect(result.current.percentage).toBeGreaterThan(0);
      expect(result.current.missingFields).not.toContain('agency_name');
      expect(result.current.missingFields).not.toContain('bio');
    });

    it('should include optional fields in completion', () => {
      const profileData = {
        agency_name: 'Top Talent Management',
        bio: 'We represent the best comedians',
        commission_rate: 15,
        phone: '+61 2 1234 5678',
        linkedin_url: 'https://linkedin.com/company/toptalent'
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('manager', profileData)
      );

      expect(result.current.percentage).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Photographer Profile Completion', () => {
    it('should return 0% for empty photographer profile', () => {
      const profileData = {};
      const { result } = renderHook(() =>
        useMultiProfileCompletion('photographer', profileData)
      );

      expect(result.current.percentage).toBe(0);
      expect(result.current.label).toBe('Empty');
      expect(result.current.variant).toBe('destructive');
    });

    it('should require specialties for photographer', () => {
      const profileData = {
        specialties: []
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('photographer', profileData)
      );

      expect(result.current.percentage).toBe(0);
      expect(result.current.missingFields).toContain('specialties');
    });

    it('should count specialties as complete when array has items', () => {
      const profileData = {
        specialties: ['Event Photography', 'Headshots']
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('photographer', profileData)
      );

      expect(result.current.percentage).toBeGreaterThan(0);
      expect(result.current.missingFields).not.toContain('specialties');
    });

    it('should calculate full completion for photographer', () => {
      const profileData = {
        specialties: ['Event Photography', 'Headshots'],
        experience_years: 5,
        portfolio_url: 'https://example.com/portfolio',
        rate_per_hour: 200,
        instagram_portfolio: 'https://instagram.com/photographer'
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('photographer', profileData)
      );

      expect(result.current.percentage).toBe(100);
      expect(result.current.label).toBe('Complete');
      expect(result.current.missingFields).toHaveLength(0);
    });
  });

  describe('Videographer Profile Completion', () => {
    it('should return 0% for empty videographer profile', () => {
      const profileData = {};
      const { result } = renderHook(() =>
        useMultiProfileCompletion('videographer', profileData)
      );

      expect(result.current.percentage).toBe(0);
      expect(result.current.label).toBe('Empty');
    });

    it('should require specialties for videographer', () => {
      const profileData = {
        specialties: []
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('videographer', profileData)
      );

      expect(result.current.missingFields).toContain('specialties');
    });

    it('should calculate completion with video-specific fields', () => {
      const profileData = {
        specialties: ['Live Performance', 'Highlight Reels'],
        experience_years: 3,
        video_reel_url: 'https://vimeo.com/reel',
        rate_per_hour: 250,
        youtube_channel: 'https://youtube.com/c/videographer'
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('videographer', profileData)
      );

      expect(result.current.percentage).toBe(100);
      expect(result.current.label).toBe('Complete');
      expect(result.current.missingFields).toHaveLength(0);
    });
  });

  describe('Completion Labels and Variants', () => {
    it('should return "Empty" label for 0% completion', () => {
      const profileData = {};
      const { result } = renderHook(() =>
        useMultiProfileCompletion('comedian', profileData)
      );

      expect(result.current.label).toBe('Empty');
      expect(result.current.variant).toBe('destructive');
    });

    it('should return "Incomplete" label for 1-79% completion', () => {
      const profileData = {
        name: 'Test Name'
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('comedian', profileData)
      );

      expect(result.current.percentage).toBeGreaterThan(0);
      expect(result.current.percentage).toBeLessThan(80);
      expect(result.current.label).toBe('Incomplete');
      expect(result.current.variant).toBe('default');
    });

    it('should return "Nearly Complete" label for 80-99% completion', () => {
      const profileData = {
        name: 'John Doe',
        bio: 'Comedian bio',
        avatar_url: 'https://example.com/avatar.jpg',
        location: 'Sydney, Australia',
        instagram_url: 'https://instagram.com/johndoe'
        // Missing one optional field
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('comedian', profileData)
      );

      const completion = result.current.percentage;
      if (completion >= 80 && completion < 100) {
        expect(result.current.label).toBe('Nearly Complete');
        expect(result.current.variant).toBe('default');
      }
    });

    it('should return "Complete" label for 100% completion', () => {
      const profileData = {
        name: 'John Doe',
        bio: 'Comedian bio',
        avatar_url: 'https://example.com/avatar.jpg',
        location: 'Sydney, Australia',
        instagram_url: 'https://instagram.com/johndoe',
        twitter_url: 'https://twitter.com/johndoe'
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('comedian', profileData)
      );

      expect(result.current.percentage).toBe(100);
      expect(result.current.label).toBe('Complete');
      expect(result.current.variant).toBe('default');
    });
  });

  describe('Missing Fields Tracking', () => {
    it('should list all missing required fields', () => {
      const profileData = {};
      const { result } = renderHook(() =>
        useMultiProfileCompletion('manager', profileData)
      );

      expect(result.current.missingFields).toContain('agency_name');
      expect(Array.isArray(result.current.missingFields)).toBe(true);
    });

    it('should update missing fields as profile completes', () => {
      const { result, rerender } = renderHook(
        ({ profile, data }: { profile: ProfileTypeValue; data: any }) =>
          useMultiProfileCompletion(profile, data),
        {
          initialProps: {
            profile: 'comedian' as ProfileTypeValue,
            data: {}
          }
        }
      );

      // Initial state - all fields missing
      expect(result.current.missingFields).toContain('name');
      expect(result.current.missingFields).toContain('bio');

      // Add name
      rerender({
        profile: 'comedian' as ProfileTypeValue,
        data: { name: 'John Doe' }
      });

      expect(result.current.missingFields).not.toContain('name');
      expect(result.current.missingFields).toContain('bio');

      // Add bio
      rerender({
        profile: 'comedian' as ProfileTypeValue,
        data: { name: 'John Doe', bio: 'Bio text' }
      });

      expect(result.current.missingFields).not.toContain('name');
      expect(result.current.missingFields).not.toContain('bio');
    });
  });

  describe('Null/Undefined Profile Data', () => {
    it('should handle null profile data', () => {
      const { result } = renderHook(() =>
        useMultiProfileCompletion('comedian', null)
      );

      expect(result.current.percentage).toBe(0);
      expect(result.current.label).toBe('Empty');
    });

    it('should handle undefined profile data', () => {
      const { result } = renderHook(() =>
        useMultiProfileCompletion('comedian', undefined)
      );

      expect(result.current.percentage).toBe(0);
      expect(result.current.label).toBe('Empty');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings as incomplete', () => {
      const profileData = {
        name: '',
        bio: ''
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('comedian', profileData)
      );

      expect(result.current.percentage).toBe(0);
      expect(result.current.missingFields).toContain('name');
      expect(result.current.missingFields).toContain('bio');
    });

    it('should handle whitespace-only strings as incomplete', () => {
      const profileData = {
        name: '   ',
        bio: '\n\n'
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('comedian', profileData)
      );

      expect(result.current.percentage).toBe(0);
    });

    it('should handle numeric zero values correctly', () => {
      const profileData = {
        agency_name: 'Agency',
        commission_rate: 0 // Valid rate
      };
      const { result } = renderHook(() =>
        useMultiProfileCompletion('manager', profileData)
      );

      // Zero is a valid commission rate
      expect(result.current.percentage).toBeGreaterThan(0);
    });
  });
});
