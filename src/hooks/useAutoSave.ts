import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { localStorage } from '@/utils/localStorage';
import { debounce } from '@/utils/debounce';
import { EventFormData, CreateEventInput, EventStatus } from '@/types/events.unified';
import { useToast } from './use-toast';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveState {
  status: AutoSaveStatus;
  lastSaved: Date | null;
  error: Error | null;
}

interface UseAutoSaveOptions {
  formData: Partial<EventFormData>;
  eventId?: string;
  isEnabled?: boolean;
  onSave?: (savedData: { id?: string; localKey: string }) => void;
  debounceMs?: number;
}

interface UseAutoSaveReturn extends AutoSaveState {
  autoSaveStatus: AutoSaveStatus;
  saveNow: () => Promise<void>;
  clearLocalDraft: () => void;
}

const LOCAL_STORAGE_PREFIX = 'event_draft_';
const LOCAL_STORAGE_TTL_MINUTES = 60 * 24 * 7; // 7 days

/**
 * Transform EventFormData to CreateEventInput for database
 */
function transformFormDataToInput(formData: Partial<EventFormData>): Partial<CreateEventInput> {
  const { 
    title = '',
    venue = '',
    address = '',
    city,
    state,
    country,
    date,
    time,
    endTime,
    type,
    spots,
    description,
    requirements,
    isVerifiedOnly,
    isPaid,
    allowRecording,
    ageRestriction,
    dresscode,
    imageUrl,
    capacity,
    ticketingType,
    externalTicketUrl,
    tickets,
    ...rest
  } = formData;

  return {
    title,
    venue,
    address,
    city,
    state,
    country,
    event_date: date,
    start_time: time,
    end_time: endTime,
    type,
    spots,
    description,
    requirements,
    is_verified_only: isVerifiedOnly,
    is_paid: isPaid,
    allow_recording: allowRecording,
    age_restriction: ageRestriction,
    dress_code: dresscode,
    image_url: imageUrl,
    capacity,
    status: EventStatus.DRAFT,
    ...rest
  };
}

/**
 * Hook for auto-saving event form data to localStorage and database
 */
export function useAutoSave({
  formData,
  eventId,
  isEnabled = true,
  onSave,
  debounceMs = 3000
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<AutoSaveState>({
    status: 'idle',
    lastSaved: null,
    error: null
  });
  
  const isMountedRef = useRef(true);
  const savePromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getLocalStorageKey = useCallback(() => {
    const baseKey = eventId || 'new';
    return `${LOCAL_STORAGE_PREFIX}${user?.id || 'anon'}_${baseKey}`;
  }, [eventId, user?.id]);

  /**
   * Save to localStorage
   */
  const saveToLocalStorage = useCallback(() => {
    if (!isEnabled) return;

    try {
      const key = getLocalStorageKey();
      const dataToSave = {
        formData,
        eventId,
        userId: user?.id,
        lastModified: new Date().toISOString()
      };

      localStorage.setItem(key, dataToSave, LOCAL_STORAGE_TTL_MINUTES);
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          status: 'saved',
          lastSaved: new Date(),
          error: null
        }));
      }
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      
      if (error instanceof Error && error.message.includes('QUOTA_EXCEEDED')) {
        toast({
          title: 'Storage Full',
          description: 'Local storage is full. Some changes may not be saved locally.',
          variant: 'warning'
        });
      }
      
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error : new Error('Failed to save locally')
        }));
      }
    }
  }, [formData, eventId, user?.id, isEnabled, getLocalStorageKey, toast]);

  /**
   * Save to database as draft
   */
  const saveToDatabase = useCallback(async () => {
    if (!isEnabled || !user?.id) {
      return;
    }

    if (savePromiseRef.current) {
      return savePromiseRef.current;
    }

    const savePromise = async () => {
      setState(prev => ({ ...prev, status: 'saving', error: null }));

      try {
        const eventData = transformFormDataToInput(formData);
        
        let savedId = eventId;

        if (eventId) {
          // Update existing draft
          const { error } = await supabase
            .from('events')
            .update({
              ...eventData,
              updated_at: new Date().toISOString()
            })
            .eq('id', eventId)
            .eq('promoter_id', user.id)
            .eq('status', EventStatus.DRAFT);

          if (error) throw error;
        } else {
          // Create new draft
          const { data, error } = await supabase
            .from('events')
            .insert({
              ...eventData,
              promoter_id: user.id,
              status: EventStatus.DRAFT
            })
            .select('id')
            .single();

          if (error) throw error;
          savedId = data.id;
        }

        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            status: 'saved',
            lastSaved: new Date(),
            error: null
          }));

          onSave?.({
            id: savedId,
            localKey: getLocalStorageKey()
          });
        }
      } catch (error) {
        console.error('Failed to save to database:', error);
        
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            status: 'error',
            error: error instanceof Error ? error : new Error('Failed to save to database')
          }));

          toast({
            title: 'Auto-save failed',
            description: 'Your changes are saved locally but could not be saved to the server.',
            variant: 'warning'
          });
        }
      } finally {
        savePromiseRef.current = null;
      }
    };

    savePromiseRef.current = savePromise();
    return savePromiseRef.current;
  }, [formData, eventId, user?.id, isEnabled, onSave, getLocalStorageKey, toast]);

  /**
   * Combined save function (localStorage + database)
   */
  const performSave = useCallback(async () => {
    if (!isEnabled) return;

    // Always save to localStorage first (synchronous)
    saveToLocalStorage();
    
    // Then attempt to save to database
    await saveToDatabase();
  }, [isEnabled, saveToLocalStorage, saveToDatabase]);

  // Create debounced save function
  const debouncedSave = useMemo(() => debounce(performSave, debounceMs), [performSave, debounceMs]);

  // Auto-save when form data changes
  useEffect(() => {
    if (isEnabled && formData && Object.keys(formData).length > 0) {
      debouncedSave();
    }

    return () => {
      debouncedSave.cancel();
    };
  }, [formData, isEnabled, debouncedSave]);

  /**
   * Manual save function (bypasses debounce)
   */
  const saveNow = useCallback(async () => {
    debouncedSave.cancel();
    await performSave();
  }, [debouncedSave, performSave]);

  /**
   * Clear local draft
   */
  const clearLocalDraft = useCallback(() => {
    const key = getLocalStorageKey();
    localStorage.removeItem(key);
    setState({
      status: 'idle',
      lastSaved: null,
      error: null
    });
  }, [getLocalStorageKey]);

  return {
    status: state.status,
    autoSaveStatus: state.status,
    lastSaved: state.lastSaved,
    error: state.error,
    saveNow,
    clearLocalDraft
  };
}
