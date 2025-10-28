// tests/hooks/useSlugValidation.test.tsx
import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';

const fromMock = jest.fn();

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useSlugValidation', () => {
  it('returns valid for unique slug', async () => {
    const { useSlugValidation } = require('@/hooks/useSlugValidation');

    const singleMock = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }
    });
    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ select: selectMock });

    const { result } = renderHook(() =>
      useSlugValidation('chillz-skinner', 'comedian')
    );

    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
      expect(result.current.error).toBeUndefined();
    }, { timeout: 1000 });
  });

  it('returns error for taken slug', async () => {
    const { useSlugValidation } = require('@/hooks/useSlugValidation');

    const singleMock = jest.fn().mockResolvedValue({
      data: { id: 'existing-id' },
      error: null,
    });
    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ select: selectMock });

    const { result } = renderHook(() =>
      useSlugValidation('taken-slug', 'comedian')
    );

    await waitFor(() => {
      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toContain('already taken');
    }, { timeout: 1000 });
  });

  it('validates format before checking database', async () => {
    const { useSlugValidation } = require('@/hooks/useSlugValidation');

    const { result } = renderHook(() =>
      useSlugValidation('invalid@slug', 'comedian')
    );

    await waitFor(() => {
      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toContain('lowercase letters');
    });
  });
});
