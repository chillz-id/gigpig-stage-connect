import { describe, it, expect } from '@jest/globals';

describe('comedian_lite type definitions', () => {
  it('should accept comedian_lite in UserRole union', () => {
    type UserRole = 'member' | 'comedian' | 'comedian_lite' | 'promoter' | 'admin';

    const validRole: UserRole = 'comedian_lite';
    expect(validRole).toBe('comedian_lite');
  });

  it('should include comedian_lite in role checks', () => {
    const roles = ['comedian', 'comedian_lite', 'promoter'];

    expect(roles.includes('comedian_lite')).toBe(true);
  });

  it('should display comedian_lite as Comedian', () => {
    const getRoleDisplayName = (role: string): string => {
      if (role === 'comedian_lite') return 'Comedian';
      if (role === 'agency_manager') return 'Agency Manager';
      return role.charAt(0).toUpperCase() + role.slice(1);
    };

    expect(getRoleDisplayName('comedian_lite')).toBe('Comedian');
    expect(getRoleDisplayName('comedian')).toBe('Comedian');
    expect(getRoleDisplayName('promoter')).toBe('Promoter');
  });
});
