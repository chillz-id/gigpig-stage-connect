
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WaitlistEntry } from '@/types/waitlist';
import { useToast } from '@/hooks/use-toast';

export const useWaitlist = (eventId: string) => {
  const { toast } = useToast();
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [waitlistCount, setWaitlistCount] = useState(0);

  const fetchWaitlist = async () => {
    try {
      const { data, error } = await supabase
        .from('event_waitlists')
        .select('*')
        .eq('event_id', eventId)
        .order('position', { ascending: true });

      if (error) throw error;

      setWaitlistEntries(data || []);
      setWaitlistCount(data?.length || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load waitlist data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchWaitlist();
    }
  }, [eventId]);

  return {
    waitlistEntries,
    waitlistCount,
    loading,
    refetchWaitlist: fetchWaitlist
  };
};
