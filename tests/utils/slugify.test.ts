// tests/utils/slugify.test.ts
import { describe, it, expect } from '@jest/globals';
import { slugify, isReservedSlug, validateSlug } from '@/utils/slugify';

describe('slugify', () => {
  it('converts text to lowercase', () => {
    expect(slugify('UPPERCASE')).toBe('uppercase');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('multiple words here')).toBe('multiple-words-here');
  });

  it('removes special characters', () => {
    expect(slugify('hello@world!')).toBe('helloworld');
  });

  it('handles multiple hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('-hello-world-')).toBe('hello-world');
  });

  it('handles real comedian names', () => {
    expect(slugify('Chillz Skinner')).toBe('chillz-skinner');
    expect(slugify("O'Brien Comedy")).toBe('obrien-comedy');
  });
});

describe('isReservedSlug', () => {
  it('returns true for reserved slugs', () => {
    expect(isReservedSlug('dashboard')).toBe(true);
    expect(isReservedSlug('settings')).toBe(true);
    expect(isReservedSlug('admin')).toBe(true);
  });

  it('returns false for non-reserved slugs', () => {
    expect(isReservedSlug('chillz-skinner')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isReservedSlug('DASHBOARD')).toBe(true);
  });
});

describe('validateSlug', () => {
  it('returns valid for good slugs', () => {
    const result = validateSlug('chillz-skinner');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects empty slugs', () => {
    const result = validateSlug('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('rejects reserved slugs', () => {
    const result = validateSlug('dashboard');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('reserved');
  });

  it('rejects slugs with invalid characters', () => {
    const result = validateSlug('hello@world');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('letters, numbers, and hyphens');
  });

  it('rejects slugs that are too short', () => {
    const result = validateSlug('ab');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('3 characters');
  });
});
