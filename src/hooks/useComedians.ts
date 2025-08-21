
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Comedian } from '@/types/comedian';
import { fetchComedians, sendComedianMessage } from '@/services/comedianService';

export const useComedians = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comedians, setComedians] = useState<Comedian[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState<string | null>(null);

  const loadComedians = async (): Promise<void> => {
    try {
      const fetchedComedians = await fetchComedians();
      setComedians(fetchedComedians);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load comedians",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (comedianId: string, comedianEmail: string): Promise<void> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to contact comedians.",
        variant: "destructive",
      });
      return;
    }

    setContacting(comedianId);
    try {
      await sendComedianMessage(user.id, comedianId, comedianEmail);

      toast({
        title: "Message Sent",
        description: "Your inquiry has been sent to the comedian.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setContacting(null);
    }
  };

  useEffect(() => {
    loadComedians();
  }, []);

  return {
    comedians,
    loading,
    contacting,
    handleContact
  };
};
