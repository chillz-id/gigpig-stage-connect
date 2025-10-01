// Tour Participant Service - Participant and collaboration management
import { supabase } from '@/integrations/supabase/client';
import type {
  TourParticipant,
  TourCollaboration,
  CreateTourParticipantRequest,
  CreateTourCollaborationRequest,
  TourParticipantWithUser,
  TourCollaborationWithUser
} from '@/types/tour';

class TourParticipantService {
  // =====================================
  // TOUR PARTICIPANT MANAGEMENT
  // =====================================

  async createTourParticipant(data: CreateTourParticipantRequest): Promise<TourParticipant> {
    const { data: participant, error } = await supabase
      .from('tour_participants')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return participant;
  }

  async updateTourParticipant(id: string, data: Partial<CreateTourParticipantRequest>): Promise<TourParticipant> {
    const { data: participant, error } = await supabase
      .from('tour_participants')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return participant;
  }

  async getTourParticipants(tourId: string): Promise<TourParticipantWithUser[]> {
    const { data, error } = await supabase
      .from('tour_participants')
      .select(`
        *,
        profiles!inner(
          id,
          name,
          email,
          role,
          avatar_url
        )
      `)
      .eq('tour_id', tourId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async deleteTourParticipant(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_participants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================
  // TOUR COLLABORATION MANAGEMENT
  // =====================================

  async createTourCollaboration(data: CreateTourCollaborationRequest): Promise<TourCollaboration> {
    // First check if a collaboration already exists between these users for this tour
    const { data: existing } = await supabase
      .from('tour_collaborations')
      .select('id')
      .eq('tour_id', data.tour_id)
      .eq('requester_id', data.requester_id)
      .eq('collaborator_id', data.collaborator_id)
      .single();

    if (existing) {
      throw new Error('Collaboration request already exists');
    }

    const { data: collaboration, error } = await supabase
      .from('tour_collaborations')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return collaboration;
  }

  async updateTourCollaboration(id: string, data: Partial<CreateTourCollaborationRequest>): Promise<TourCollaboration> {
    const { data: collaboration, error } = await supabase
      .from('tour_collaborations')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return collaboration;
  }

  async getTourCollaborations(tourId: string): Promise<TourCollaborationWithUser[]> {
    const { data, error } = await supabase
      .from('tour_collaborations')
      .select(`
        *,
        requester:profiles!tour_collaborations_requester_id_fkey(
          id,
          name,
          email,
          role,
          avatar_url
        ),
        collaborator:profiles!tour_collaborations_collaborator_id_fkey(
          id,
          name,
          email,
          role,
          avatar_url
        )
      `)
      .eq('tour_id', tourId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async respondToCollaboration(id: string, accept: boolean): Promise<TourCollaboration> {
    const updateData = {
      status: accept ? 'accepted' : 'declined',
      responded_at: new Date().toISOString()
    };

    const { data: collaboration, error } = await supabase
      .from('tour_collaborations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If accepted, add the collaborator as a participant
    if (accept && collaboration) {
      const participantData: CreateTourParticipantRequest = {
        tour_id: collaboration.tour_id,
        user_id: collaboration.collaborator_id,
        role: 'collaborator',
        status: 'active'
      };

      await this.createTourParticipant(participantData);
    }

    return collaboration;
  }

  async deleteTourCollaboration(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_collaborations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================
  // PARTICIPANT UTILITY METHODS
  // =====================================

  async getParticipantByUserAndTour(userId: string, tourId: string): Promise<TourParticipant | null> {
    const { data, error } = await supabase
      .from('tour_participants')
      .select('*')
      .eq('user_id', userId)
      .eq('tour_id', tourId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async isUserParticipant(userId: string, tourId: string): Promise<boolean> {
    const participant = await this.getParticipantByUserAndTour(userId, tourId);
    return participant !== null;
  }

  async getParticipantsByRole(tourId: string, role: string): Promise<TourParticipantWithUser[]> {
    const { data, error } = await supabase
      .from('tour_participants')
      .select(`
        *,
        profiles!inner(
          id,
          name,
          email,
          role,
          avatar_url
        )
      `)
      .eq('tour_id', tourId)
      .eq('role', role)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getPendingCollaborations(userId: string): Promise<TourCollaborationWithUser[]> {
    const { data, error } = await supabase
      .from('tour_collaborations')
      .select(`
        *,
        tours!inner(
          id,
          name,
          description,
          start_date,
          end_date
        ),
        requester:profiles!tour_collaborations_requester_id_fkey(
          id,
          name,
          email,
          role,
          avatar_url
        )
      `)
      .eq('collaborator_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const tourParticipantService = new TourParticipantService();
export default TourParticipantService;