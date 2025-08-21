import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useEventApplications } from '@/hooks/useEventApplications';
import { useBrowseLogic } from '@/hooks/useBrowseLogic';

// Mock the dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    hasRole: jest.fn().mockReturnValue(true),
    profile: { name: 'Test Comedian' }
  })
}));

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'app-1' }, error: null })
        })
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      })
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
    }
  }
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({ eventId: 'event-1' })
}));

describe('Application Form Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useEventApplications', () => {
    it('should submit application successfully', async () => {
      const { result } = renderHook(() => useEventApplications());
      
      await act(async () => {
        result.current.applyToEvent({
          event_id: 'event-1',
          message: 'Test message',
          status: 'pending'
        });
      });

      expect(result.current.isApplying).toBe(false);
    });

    it('should handle loading state during application', () => {
      const { result } = renderHook(() => useEventApplications());
      
      expect(result.current.isApplying).toBe(false);
      expect(result.current.applications).toEqual([]);
      expect(result.current.userApplications).toEqual([]);
    });
  });

  describe('useBrowseLogic', () => {
    it('should navigate to application form on apply', () => {
      const mockNavigate = jest.fn();
      jest.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);
      
      const { result } = renderHook(() => useBrowseLogic());
      
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        status: 'open'
      };
      
      act(() => {
        result.current.handleApply(mockEvent);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/events/event-1/apply');
    });

    it('should check application status correctly', () => {
      const { result } = renderHook(() => useBrowseLogic());
      
      const hasApplied = result.current.hasAppliedToEvent('event-1');
      expect(hasApplied).toBe(false);
    });
  });
});