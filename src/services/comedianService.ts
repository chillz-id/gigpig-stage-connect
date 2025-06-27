
import { supabase } from '@/integrations/supabase/client';
import { Comedian } from '@/types/comedian';
import { mockComedians } from '@/data/mockComedians';

export const fetchComedians = async (): Promise<Comedian[]> => {
  // Fetch all profiles for now (remove problematic query)
  const { data: profilesData, error } = await supabase
    .from('profiles')
    .select('id, name, bio, location, avatar_url, is_verified, email');

  if (error) throw error;
  
  const dbComedians: Comedian[] = (profilesData || []).map((profile) => ({
    id: profile.id,
    name: profile.name,
    bio: profile.bio,
    location: profile.location,
    avatar_url: profile.avatar_url,
    is_verified: profile.is_verified || false,
    email: profile.email
  }));
  
  return [...dbComedians, ...mockComedians];
};

export const sendComedianMessage = async (
  senderId: string,
  comedianId: string,
  comedianEmail: string
): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      recipient_id: comedianId,
      subject: 'Booking Inquiry from Stand Up Sydney',
      content: `Hi! I'm interested in booking you for a comedy show. I found your profile on Stand Up Sydney and would love to discuss potential opportunities.`,
    });

  if (error) throw error;
};
