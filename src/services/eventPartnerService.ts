/**
 * Event Partner Service
 *
 * Manages event partnerships - adding partners (users/orgs) to events
 * with configurable permissions. Partners can be added manually or
 * auto-synced from deal participants.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type PartnerType = 'manual' | 'deal_participant' | 'co_promoter';
export type PartnerStatus = 'pending_invite' | 'active' | 'inactive';

export interface PartnerPermissions {
  can_view_details: boolean;
  can_edit_event: boolean;
  can_view_financials: boolean;
  can_manage_financials: boolean;
  can_receive_crm_data: boolean;
}

export interface EventPartner {
  id: string;
  event_id: string;
  partner_profile_id: string | null;
  partner_type: PartnerType;
  source_deal_id: string | null;
  can_view_details: boolean;
  can_edit_event: boolean;
  can_view_financials: boolean;
  can_manage_financials: boolean;
  can_receive_crm_data: boolean;
  status: PartnerStatus;
  invited_email: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventPartnerWithProfile extends EventPartner {
  partner_profile?: {
    id: string;
    name: string | null;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  added_by_profile?: {
    id: string;
    name: string | null;
    display_name: string | null;
  } | null;
}

export interface AddPartnerInput {
  event_id: string;
  partner_profile_id?: string;
  invited_email?: string;
  permissions?: Partial<PartnerPermissions>;
}

export interface UpdatePartnerPermissionsInput {
  partner_id: string;
  permissions: Partial<PartnerPermissions>;
}

// ============================================================================
// DEFAULT PERMISSIONS
// ============================================================================

export const DEFAULT_PARTNER_PERMISSIONS: PartnerPermissions = {
  can_view_details: true,
  can_edit_event: false,
  can_view_financials: false,
  can_manage_financials: false,
  can_receive_crm_data: false,
};

export const DEAL_PARTICIPANT_PERMISSIONS: PartnerPermissions = {
  can_view_details: true,
  can_edit_event: false,
  can_view_financials: true, // Deal participants see financials by default
  can_manage_financials: false,
  can_receive_crm_data: false,
};

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get all partners for an event
 */
export async function getEventPartners(eventId: string): Promise<EventPartnerWithProfile[]> {
  const { data, error } = await supabase
    .from('event_partners')
    .select(`
      *,
      partner_profile:partner_profile_id (
        id,
        name,
        display_name,
        email,
        avatar_url
      ),
      added_by_profile:added_by (
        id,
        name,
        display_name
      )
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching event partners:', error);
    throw error;
  }

  return (data || []) as EventPartnerWithProfile[];
}

/**
 * Get a single partner by ID
 */
export async function getPartner(partnerId: string): Promise<EventPartnerWithProfile | null> {
  const { data, error } = await supabase
    .from('event_partners')
    .select(`
      *,
      partner_profile:partner_profile_id (
        id,
        name,
        display_name,
        email,
        avatar_url
      ),
      added_by_profile:added_by (
        id,
        name,
        display_name
      )
    `)
    .eq('id', partnerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching partner:', error);
    throw error;
  }

  return data as EventPartnerWithProfile;
}

/**
 * Add a partner to an event
 */
export async function addPartner(input: AddPartnerInput): Promise<EventPartner> {
  const { event_id, partner_profile_id, invited_email, permissions = {} } = input;

  // Validate input
  if (!partner_profile_id && !invited_email) {
    throw new Error('Either partner_profile_id or invited_email is required');
  }

  // Get current user for added_by
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const partnerData = {
    event_id,
    partner_profile_id: partner_profile_id || null,
    invited_email: partner_profile_id ? null : invited_email,
    partner_type: 'manual' as PartnerType,
    status: partner_profile_id ? 'active' : 'pending_invite' as PartnerStatus,
    added_by: user.id,
    ...DEFAULT_PARTNER_PERMISSIONS,
    ...permissions,
  };

  const { data, error } = await supabase
    .from('event_partners')
    .insert(partnerData)
    .select()
    .single();

  if (error) {
    console.error('Error adding partner:', error);
    throw error;
  }

  return data as EventPartner;
}

/**
 * Update partner permissions
 */
export async function updatePartnerPermissions(
  input: UpdatePartnerPermissionsInput
): Promise<EventPartner> {
  const { partner_id, permissions } = input;

  const { data, error } = await supabase
    .from('event_partners')
    .update({
      ...permissions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', partner_id)
    .select()
    .single();

  if (error) {
    console.error('Error updating partner permissions:', error);
    throw error;
  }

  return data as EventPartner;
}

/**
 * Remove a partner from an event
 */
export async function removePartner(partnerId: string): Promise<void> {
  const { error } = await supabase
    .from('event_partners')
    .delete()
    .eq('id', partnerId);

  if (error) {
    console.error('Error removing partner:', error);
    throw error;
  }
}

/**
 * Deactivate a partner (soft delete)
 */
export async function deactivatePartner(partnerId: string): Promise<EventPartner> {
  const { data, error } = await supabase
    .from('event_partners')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', partnerId)
    .select()
    .single();

  if (error) {
    console.error('Error deactivating partner:', error);
    throw error;
  }

  return data as EventPartner;
}

/**
 * Reactivate an inactive partner
 */
export async function reactivatePartner(partnerId: string): Promise<EventPartner> {
  const { data, error } = await supabase
    .from('event_partners')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', partnerId)
    .select()
    .single();

  if (error) {
    console.error('Error reactivating partner:', error);
    throw error;
  }

  return data as EventPartner;
}

/**
 * Check if a user is a partner on an event
 */
export async function isUserEventPartner(
  eventId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('event_partners')
    .select('id')
    .eq('event_id', eventId)
    .eq('partner_profile_id', userId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking partner status:', error);
    throw error;
  }

  return !!data;
}

/**
 * Get partner permissions for a user on an event
 */
export async function getPartnerPermissions(
  eventId: string,
  userId: string
): Promise<PartnerPermissions | null> {
  const { data, error } = await supabase
    .from('event_partners')
    .select('can_view_details, can_edit_event, can_view_financials, can_manage_financials, can_receive_crm_data')
    .eq('event_id', eventId)
    .eq('partner_profile_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not a partner
    console.error('Error fetching partner permissions:', error);
    throw error;
  }

  return data as PartnerPermissions;
}

/**
 * Get all events where a user is a partner
 */
export async function getUserPartnerEvents(userId: string): Promise<{
  event_id: string;
  permissions: PartnerPermissions;
  partner_type: PartnerType;
}[]> {
  const { data, error } = await supabase
    .from('event_partners')
    .select('event_id, partner_type, can_view_details, can_edit_event, can_view_financials, can_manage_financials, can_receive_crm_data')
    .eq('partner_profile_id', userId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching user partner events:', error);
    throw error;
  }

  return (data || []).map(d => ({
    event_id: d.event_id,
    partner_type: d.partner_type as PartnerType,
    permissions: {
      can_view_details: d.can_view_details,
      can_edit_event: d.can_edit_event,
      can_view_financials: d.can_view_financials,
      can_manage_financials: d.can_manage_financials,
      can_receive_crm_data: d.can_receive_crm_data,
    },
  }));
}

/**
 * Search for profiles to add as partners
 */
export async function searchProfilesToAdd(
  query: string,
  eventId: string
): Promise<{
  id: string;
  name: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}[]> {
  // Get existing partner profile IDs to exclude
  const { data: existingPartners } = await supabase
    .from('event_partners')
    .select('partner_profile_id')
    .eq('event_id', eventId)
    .not('partner_profile_id', 'is', null);

  const existingIds = (existingPartners || [])
    .map(p => p.partner_profile_id)
    .filter(Boolean);

  // Search profiles
  let profileQuery = supabase
    .from('profiles')
    .select('id, name, display_name, email, avatar_url')
    .or(`name.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);

  if (existingIds.length > 0) {
    profileQuery = profileQuery.not('id', 'in', `(${existingIds.join(',')})`);
  }

  const { data, error } = await profileQuery;

  if (error) {
    console.error('Error searching profiles:', error);
    throw error;
  }

  return data || [];
}
