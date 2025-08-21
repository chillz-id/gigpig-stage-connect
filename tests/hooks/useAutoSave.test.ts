import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { localStorage } from '@/utils/localStorage';
import { supabase } from '@/integrations/supabase/client';
import { EventFormData, EventStatus } from '@/types/events.unified';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Define waitFor helper
const waitFor = async (callback: () => void | Promise<void>, options?: { timeout?: number }) => {
  const timeout = options?.timeout || 1000;
  const interval = 50;
  const endTime = Date.now() + timeout;
  
  while (Date.now() < endTime) {
    try {
      await callback();
      return;
    } catch (error) {
      if (Date.now() >= endTime) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
};

// Mock dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/hooks/use-toast');
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn()
  }
}));

// Mock localStorage utility
jest.mock('@/utils/localStorage', () => ({
  localStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    hasItem: jest.fn(),
    isAvailable: jest.fn(() => true),
    clearExpired: jest.fn()
  }
}));

describe('useAutoSave', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockToast = jest.fn();
  const mockOnSave = jest.fn();

  const mockFormData: Partial<EventFormData> = {
    title: 'Test Event',
    venue: 'Test Venue',
    address: '123 Test St',
    date: '2024-03-01',
    time: '19:00',
    description: 'Test description'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('localStorage saving', () => {
    it('should save to localStorage after debounce period', async () => {
      const { result } = renderHook(() =>
        useAutoSave({
          formData: mockFormData,
          isEnabled: true,
          debounceMs: 100
        })
      );

      expect(result.current.status).toBe('idle');
      expect(localStorage.setItem).not.toHaveBeenCalled();

      // Fast-forward past debounce
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'event_draft_user-123_new',
          expect.objectContaining({
            formData: mockFormData,
            eventId: undefined,
            userId: 'user-123',
            lastModified: expect.any(String)
          }),
          60 * 24 * 7 // 7 days TTL
        );
      });

      expect(result.current.status).toBe('saved');
      expect(result.current.lastSaved).toBeInstanceOf(Date);
    });

    it('should handle localStorage quota exceeded error', async () => {
      const quotaError = new Error('Storage quota exceeded');
      quotaError.name = 'QuotaExceededError';
      (localStorage.setItem as jest.Mock).mockImplementationOnce(() => {
        throw quotaError;
      });

      const { result } = renderHook(() =>
        useAutoSave({
          formData: mockFormData,
          isEnabled: true,
          debounceMs: 100
        })
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBeTruthy();
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Storage Full',
          description: 'Local storage is full. Some changes may not be saved locally.',
          variant: 'warning'
        });
      });
    });

    it('should use eventId in localStorage key when provided', async () => {
      renderHook(() =>
        useAutoSave({
          formData: mockFormData,
          eventId: 'event-456',
          isEnabled: true,
          debounceMs: 100
        })
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'event_draft_user-123_event-456',
          expect.any(Object),
          expect.any(Number)
        );
      });
    });
  });

  describe('database saving', () => {
    it('should create new draft event when no eventId provided', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'new-event-id' },
            error: null
          })
        })
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });

      renderHook(() =>
        useAutoSave({
          formData: mockFormData,
          isEnabled: true,
          onSave: mockOnSave,
          debounceMs: 100
        })
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Event',
            venue: 'Test Venue',
            address: '123 Test St',
            event_date: '2024-03-01',
            start_time: '19:00',
            promoter_id: 'user-123',
            status: EventStatus.DRAFT
          })
        );
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          id: 'new-event-id',
          localKey: 'event_draft_user-123_new'
        });
      });
    });

    it('should update existing draft when eventId provided', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null
            })
          })
        })
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate
      });

      renderHook(() =>
        useAutoSave({
          formData: mockFormData,
          eventId: 'existing-event-id',
          isEnabled: true,
          debounceMs: 100
        })
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Event',
            venue: 'Test Venue',
            updated_at: expect.any(String)
          })
        );
      });
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database error');
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: dbError
            })
          })
        })
      });

      const { result } = renderHook(() =>
        useAutoSave({
          formData: mockFormData,
          isEnabled: true,
          debounceMs: 100
        })
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error?.message).toBe('Database error');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Auto-save failed',
          description: 'Your changes are saved locally but could not be saved to the server.',
          variant: 'warning'
        });
      });
    });

    it('should not save to database when user is not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null });

      renderHook(() =>
        useAutoSave({
          formData: mockFormData,
          isEnabled: true,
          debounceMs: 100
        })
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalled();
        expect(supabase.from).not.toHaveBeenCalled();
      });
    });
  });

  describe('manual save', () => {
    it('should save immediately when saveNow is called', async () => {
      const { result } = renderHook(() =>
        useAutoSave({
          formData: mockFormData,
          isEnabled: true,
          debounceMs: 3000
        })
      );

      expect(localStorage.setItem).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.saveNow();
      });

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('clear draft', () => {
    it('should clear local draft when clearLocalDraft is called', () => {
      const { result } = renderHook(() =>
        useAutoSave({
          formData: mockFormData,
          eventId: 'event-123',
          isEnabled: true
        })
      );

      act(() => {
        result.current.clearLocalDraft();
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('event_draft_user-123_event-123');
      expect(result.current.status).toBe('idle');
      expect(result.current.lastSaved).toBeNull();
    });
  });

  describe('disabled state', () => {
    it('should not save when isEnabled is false', async () => {
      const { result } = renderHook(() =>
        useAutoSave({
          formData: mockFormData,
          isEnabled: false,
          debounceMs: 100
        })
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
    });
  });

  describe('form data transformation', () => {
    it('should correctly transform EventFormData to CreateEventInput', async () => {
      const complexFormData: Partial<EventFormData> = {
        title: 'Complex Event',
        venue: 'Complex Venue',
        address: '456 Complex St',
        city: 'Sydney',
        state: 'NSW',
        country: 'Australia',
        date: '2024-03-15',
        time: '20:00',
        endTime: '23:00',
        type: 'showcase',
        spots: 10,
        description: 'A complex event',
        requirements: ['Must be funny', 'Clean content only'],
        isVerifiedOnly: true,
        isPaid: true,
        allowRecording: false,
        ageRestriction: '18+',
        dresscode: 'Smart casual',
        imageUrl: 'https://example.com/image.jpg',
        capacity: 200
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'complex-event-id' },
            error: null
          })
        })
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });

      renderHook(() =>
        useAutoSave({
          formData: complexFormData,
          isEnabled: true,
          debounceMs: 100
        })
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Complex Event',
            venue: 'Complex Venue',
            address: '456 Complex St',
            city: 'Sydney',
            state: 'NSW',
            country: 'Australia',
            event_date: '2024-03-15',
            start_time: '20:00',
            end_time: '23:00',
            type: 'showcase',
            spots: 10,
            description: 'A complex event',
            requirements: ['Must be funny', 'Clean content only'],
            is_verified_only: true,
            is_paid: true,
            allow_recording: false,
            age_restriction: '18+',
            dress_code: 'Smart casual',
            image_url: 'https://example.com/image.jpg',
            capacity: 200,
            status: EventStatus.DRAFT,
            promoter_id: 'user-123'
          })
        );
      });
    });
  });
});