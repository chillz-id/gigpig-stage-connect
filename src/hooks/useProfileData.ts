
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useProfileData = (userId: string | undefined, isMemberView: boolean = false) => {
  // Fetch user interests from database
  const { data: userInterests = [] } = useQuery({
    queryKey: ['user-interests', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Mock tickets data with much larger event images
  const mockTickets = [
    {
      id: 1,
      eventTitle: "Comedy Night Downtown",
      venue: "The Laugh Track",
      date: "2024-07-15",
      time: "8:00 PM",
      ticketType: "General Admission",
      quantity: 2,
      totalPrice: 50.00,
      eventImage: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&h=400&fit=crop"
    },
    {
      id: 2,
      eventTitle: "Friday Night Laughs",
      venue: "The Comedy Corner",
      date: "2024-08-02",
      time: "9:00 PM",
      ticketType: "VIP Package",
      quantity: 1,
      totalPrice: 65.00,
      eventImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop"
    }
  ];

  return {
    userInterests,
    mockTickets
  };
};
