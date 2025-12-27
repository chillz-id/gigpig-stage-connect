/**
 * ProfileContext.test.ts
 *
 * Unit tests for ProfileContext to verify:
 * - Promoter role has been removed from profile types
 * - Photographer and videographer are included as valid profile types
 * - Profile type constants and helpers work correctly
 */

// Mock supabase before importing ProfileContext
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    isLoading: false,
    hasRole: jest.fn(),
  }),
}));

// Mock useOrganizationProfiles hook
jest.mock('@/hooks/useOrganizationProfiles', () => ({
  useOrganizationProfiles: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

import {
  PROFILE_TYPES,
  BaseProfileType,
  ProfileTypeValue,
  isOrganizationProfile,
  getOrganizationId,
  getProfileTypeInfo,
} from '@/contexts/ProfileContext';

describe('ProfileContext - Profile Types', () => {
  describe('PROFILE_TYPES constant', () => {
    it('includes photographer as a valid profile type', () => {
      expect(PROFILE_TYPES.photographer).toBeDefined();
      expect(PROFILE_TYPES.photographer.type).toBe('photographer');
      expect(PROFILE_TYPES.photographer.label).toBe('Photographer Profile');
      expect(PROFILE_TYPES.photographer.icon).toBeDefined();
    });

    it('includes videographer as a valid profile type', () => {
      expect(PROFILE_TYPES.videographer).toBeDefined();
      expect(PROFILE_TYPES.videographer.type).toBe('videographer');
      expect(PROFILE_TYPES.videographer.label).toBe('Videographer Profile');
      expect(PROFILE_TYPES.videographer.icon).toBeDefined();
    });

    it('includes comedian as a valid profile type', () => {
      expect(PROFILE_TYPES.comedian).toBeDefined();
      expect(PROFILE_TYPES.comedian.type).toBe('comedian');
      expect(PROFILE_TYPES.comedian.label).toBe('Comedian Profile');
    });

    it('includes manager as a valid profile type', () => {
      expect(PROFILE_TYPES.manager).toBeDefined();
      expect(PROFILE_TYPES.manager.type).toBe('manager');
      expect(PROFILE_TYPES.manager.label).toBe('Manager Profile');
    });

    it('does NOT include promoter as a profile type', () => {
      // @ts-expect-error - Testing that promoter doesn't exist
      expect(PROFILE_TYPES.promoter).toBeUndefined();
    });

    it('has exactly 4 base profile types (comedian, manager, photographer, videographer)', () => {
      const baseTypes = Object.keys(PROFILE_TYPES);
      expect(baseTypes).toHaveLength(4);
      expect(baseTypes).toContain('comedian');
      expect(baseTypes).toContain('manager');
      expect(baseTypes).toContain('photographer');
      expect(baseTypes).toContain('videographer');
      expect(baseTypes).not.toContain('promoter');
    });
  });

  describe('Organization Profile Helpers', () => {
    it('isOrganizationProfile returns true for org: format', () => {
      expect(isOrganizationProfile('org:123e4567-e89b-12d3-a456-426614174000')).toBe(
        true
      );
      expect(isOrganizationProfile('org:abc123')).toBe(true);
    });

    it('isOrganizationProfile returns false for base profile types', () => {
      expect(isOrganizationProfile('comedian')).toBe(false);
      expect(isOrganizationProfile('manager')).toBe(false);
      expect(isOrganizationProfile('photographer')).toBe(false);
      expect(isOrganizationProfile('videographer')).toBe(false);
    });

    it('getOrganizationId extracts UUID from org: format', () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      expect(getOrganizationId(`org:${orgId}`)).toBe(orgId);
    });

    it('getOrganizationId returns null for non-org profiles', () => {
      expect(getOrganizationId('comedian')).toBeNull();
      expect(getOrganizationId('photographer')).toBeNull();
    });

    it('getProfileTypeInfo returns correct info for photographer', () => {
      const info = getProfileTypeInfo('photographer');
      expect(info.type).toBe('photographer');
      expect(info.label).toBe('Photographer Profile');
      expect(info.icon).toBeDefined();
    });

    it('getProfileTypeInfo returns correct info for videographer', () => {
      const info = getProfileTypeInfo('videographer');
      expect(info.type).toBe('videographer');
      expect(info.label).toBe('Videographer Profile');
      expect(info.icon).toBeDefined();
    });

    it('getProfileTypeInfo returns organization info with custom name', () => {
      const orgProfile: ProfileTypeValue = 'org:123e4567-e89b-12d3-a456-426614174000';
      const info = getProfileTypeInfo(orgProfile, 'Sydney Comedy Club');
      expect(info.type).toBe(orgProfile);
      expect(info.label).toBe('Sydney Comedy Club Organization');
      expect(info.icon).toBeDefined();
    });

    it('getProfileTypeInfo returns generic organization label without name', () => {
      const orgProfile: ProfileTypeValue = 'org:123e4567-e89b-12d3-a456-426614174000';
      const info = getProfileTypeInfo(orgProfile);
      expect(info.type).toBe(orgProfile);
      expect(info.label).toBe('Organization Profile');
      expect(info.icon).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('BaseProfileType only includes comedian, manager, photographer, videographer', () => {
      // This is a compile-time check more than runtime
      // But we can verify the type is narrower than string
      const validTypes: BaseProfileType[] = [
        'comedian',
        'manager',
        'photographer',
        'videographer',
      ];

      validTypes.forEach((type) => {
        expect(typeof type).toBe('string');
        expect(['comedian', 'manager', 'photographer', 'videographer']).toContain(
          type
        );
      });
    });

    it('ProfileTypeValue accepts both base types and org: format', () => {
      const baseProfile: ProfileTypeValue = 'comedian';
      const photographerProfile: ProfileTypeValue = 'photographer';
      const orgProfile: ProfileTypeValue = 'org:123e4567-e89b-12d3-a456-426614174000';

      expect(typeof baseProfile).toBe('string');
      expect(typeof photographerProfile).toBe('string');
      expect(typeof orgProfile).toBe('string');
    });
  });
});
