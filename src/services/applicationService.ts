
import { ApplicationData, ApplicationStats, ApplicationFilters } from '@/types/application';
import { supabase } from '@/integrations/supabase/client';

export interface EventOption {
  id: string;
  title: string;
}

// Real database functions
export async function getApplicationsByPromoter(promoterId: string): Promise<ApplicationData[]> {
  // Note: We filter by promoter_id client-side because PostgREST doesn't support .eq() on embedded fields
  const { data, error } = await supabase
    .from('applications')
    .select(`
      id,
      comedian_id,
      event_id,
      status,
      message,
      spot_type,
      availability_confirmed,
      requirements_acknowledged,
      applied_at,
      responded_at,
      events!applications_event_id_fkey (
        id,
        title,
        venue,
        event_date,
        promoter_id
      ),
      profiles!comedian_id (
        id,
        name,
        avatar_url,
        bio,
        years_experience
      )
    `)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }

  // Filter to only applications for this promoter's events
  return (data || [])
    .filter(app => app.events?.promoter_id === promoterId)
    .map(app => ({
    id: app.id,
    comedian_id: app.comedian_id,
    comedian_name: app.profiles?.name || 'Unknown',
    comedian_avatar: app.profiles?.avatar_url,
    comedian_experience: app.profiles?.years_experience ? `${app.profiles.years_experience} years` : undefined,
    comedian_rating: undefined, // Not available in current schema
    event_id: app.event_id,
    event_title: app.events?.title || 'Unknown Event',
    event_venue: app.events?.venue || 'Unknown Venue',
    event_date: app.events?.event_date || '',
    applied_at: app.applied_at || '',
    status: app.status || 'pending',
    message: app.message,
    spot_type: app.spot_type,
    availability_confirmed: app.availability_confirmed,
    requirements_acknowledged: app.requirements_acknowledged,
  }));
}

export async function getEventOptions(promoterId: string): Promise<EventOption[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title')
    .eq('promoter_id', promoterId)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data || [];
}

// Helper function to parse experience years
export const getExperienceYears = (experience: string) => {
  const match = experience.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

// Filter and sort applications
export const filterAndSortApplications = (
  applications: ApplicationData[],
  searchTerm: string,
  eventFilter: string,
  sortBy: string,
  dateRange: { from: Date | undefined; to: Date | undefined }
) => {
  return applications
    .filter(app => {
      const matchesSearch = app.comedian_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.event_title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEvent = eventFilter === 'all' || app.event_id === eventFilter;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRange.from || dateRange.to) {
        const appliedDate = new Date(app.applied_at);
        if (dateRange.from && appliedDate < dateRange.from) matchesDateRange = false;
        if (dateRange.to && appliedDate > dateRange.to) matchesDateRange = false;
      }
      
      return matchesSearch && matchesEvent && matchesDateRange;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'applied_at_desc':
          return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
        case 'applied_at_asc':
          return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
        case 'comedian_name':
          return a.comedian_name.localeCompare(b.comedian_name);
        case 'event_date':
          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        case 'most_experienced':
          return getExperienceYears(b.comedian_experience || '0') - getExperienceYears(a.comedian_experience || '0');
        default:
          return 0;
      }
    });
};

// Calculate stats
export const calculateApplicationStats = (applications: ApplicationData[]): ApplicationStats => {
  return {
    mc: applications.filter(app => app.spot_type?.toLowerCase() === 'mc').length,
    feature: applications.filter(app => app.spot_type?.toLowerCase() === 'feature').length,
    headline: applications.filter(app => app.spot_type?.toLowerCase() === 'headline' || app.spot_type?.toLowerCase() === 'headliner').length,
    spot: applications.filter(app => app.spot_type?.toLowerCase() === 'spot').length,
    pending: applications.filter(app => app.status === 'pending').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected' || app.status === 'declined').length,
    unread: applications.filter(app => app.status === 'pending').length,
    total: applications.length,
  };
};

// Get display name for spot type
export const getSpotTypeDisplayName = (spotType: string | null | undefined): string => {
  if (!spotType) return 'Open Spot';
  
  const displayNames: Record<string, string> = {
    'mc': 'MC',
    'spot': 'Spot',
    'feature': 'Feature',
    'headline': 'Headline',
    'headliner': 'Headliner'
  };
  
  return displayNames[spotType.toLowerCase()] || spotType;
};

// Get status badge color
export const getStatusBadgeColor = (status: string | null | undefined): string => {
  const statusColors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'accepted': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'declined': 'bg-red-100 text-red-800',
    'withdrawn': 'bg-gray-100 text-gray-800'
  };
  
  return statusColors[status || 'pending'] || 'bg-gray-100 text-gray-800';
};

// Validate application data
export const validateApplicationData = (data: Partial<ApplicationSubmitData>): string[] => {
  const errors: string[] = [];
  
  if (!data.event_id) {
    errors.push('Event ID is required');
  }
  
  if (data.message && data.message.length > 1000) {
    errors.push('Message must be less than 1000 characters');
  }
  
  return errors;
};

export interface ApplicationSubmitData {
  event_id: string;
  message?: string;
  spot_type?: string;
  availability_confirmed?: boolean;
  requirements_acknowledged?: boolean;
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * Approve an application
 * Changes status from 'pending' to 'accepted'
 */
export async function approveApplication(applicationId: string): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString()
    })
    .eq('id', applicationId)
    .eq('status', 'pending'); // Only approve pending applications

  if (error) {
    console.error('Error approving application:', error);
    throw error;
  }
}

/**
 * Reject an application
 * Changes status from 'pending' to 'rejected'
 */
export async function rejectApplication(applicationId: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
      ...(reason && { message: reason })
    })
    .eq('id', applicationId)
    .eq('status', 'pending'); // Only reject pending applications

  if (error) {
    console.error('Error rejecting application:', error);
    throw error;
  }
}

/**
 * Bulk approve applications
 */
export async function bulkApproveApplications(applicationIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString()
    })
    .in('id', applicationIds)
    .eq('status', 'pending');

  if (error) {
    console.error('Error bulk approving applications:', error);
    throw error;
  }
}

/**
 * Bulk reject applications
 */
export async function bulkRejectApplications(applicationIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString()
    })
    .in('id', applicationIds)
    .eq('status', 'pending');

  if (error) {
    console.error('Error bulk rejecting applications:', error);
    throw error;
  }
}

// ============================================================================
// SHORTLIST FUNCTIONALITY
// ============================================================================

/**
 * Add application to shortlist
 */
export async function addToShortlist(applicationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({
      is_shortlisted: true,
      shortlisted_at: new Date().toISOString(),
      shortlisted_by: userId
    })
    .eq('id', applicationId);

  if (error) {
    console.error('Error adding to shortlist:', error);
    throw error;
  }
}

/**
 * Remove application from shortlist
 */
export async function removeFromShortlist(applicationId: string): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({
      is_shortlisted: false,
      shortlisted_at: null,
      shortlisted_by: null
    })
    .eq('id', applicationId);

  if (error) {
    console.error('Error removing from shortlist:', error);
    throw error;
  }
}

/**
 * Bulk add to shortlist
 */
export async function bulkAddToShortlist(applicationIds: string[], userId: string): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({
      is_shortlisted: true,
      shortlisted_at: new Date().toISOString(),
      shortlisted_by: userId
    })
    .in('id', applicationIds);

  if (error) {
    console.error('Error bulk adding to shortlist:', error);
    throw error;
  }
}

/**
 * Bulk remove from shortlist
 */
export async function bulkRemoveFromShortlist(applicationIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({
      is_shortlisted: false,
      shortlisted_at: null,
      shortlisted_by: null
    })
    .in('id', applicationIds);

  if (error) {
    console.error('Error bulk removing from shortlist:', error);
    throw error;
  }
}

/**
 * Get shortlisted applications for an event
 * Now also matches applications via session_source_id for availability-based applications
 */
export async function getShortlistedApplications(eventId: string): Promise<ApplicationData[]> {
  // First, get the event details including humanitix_event_id
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('id, title, venue, event_date, humanitix_event_id')
    .eq('id', eventId)
    .single();

  if (eventError) {
    console.error('Error fetching event:', eventError);
    throw eventError;
  }

  // Build OR filter: match by event_id OR by session_source_id (for availability-based applications)
  let orFilter = `event_id.eq.${eventId}`;
  if (eventData?.humanitix_event_id) {
    orFilter += `,session_source_id.eq.${eventData.humanitix_event_id}`;
  }

  const { data, error } = await supabase
    .from('applications')
    .select(`
      id,
      comedian_id,
      event_id,
      session_source_id,
      status,
      message,
      spot_type,
      availability_confirmed,
      requirements_acknowledged,
      applied_at,
      responded_at,
      is_shortlisted,
      shortlisted_at,
      profiles!comedian_id (
        id,
        name,
        avatar_url,
        bio,
        years_experience
      )
    `)
    .or(orFilter)
    .eq('is_shortlisted', true)
    .order('shortlisted_at', { ascending: false });

  if (error) {
    console.error('Error fetching shortlisted applications:', error);
    throw error;
  }

  return (data || []).map(app => ({
    id: app.id,
    comedian_id: app.comedian_id,
    comedian_name: app.profiles?.name || 'Unknown',
    comedian_avatar: app.profiles?.avatar_url,
    comedian_experience: app.profiles?.years_experience ? `${app.profiles.years_experience} years` : undefined,
    comedian_rating: undefined,
    event_id: app.event_id || eventId,
    event_title: eventData?.title || 'Unknown Event',
    event_venue: eventData?.venue || 'Unknown Venue',
    event_date: eventData?.event_date || '',
    applied_at: app.applied_at || '',
    status: app.status || 'pending',
    message: app.message,
    spot_type: app.spot_type,
    availability_confirmed: app.availability_confirmed,
    requirements_acknowledged: app.requirements_acknowledged,
    is_shortlisted: app.is_shortlisted || false,
    shortlisted_at: app.shortlisted_at,
  }));
}

/**
 * Get applications by event (all or filtered by status)
 * Now also matches applications via session_source_id for availability-based applications
 */
export async function getApplicationsByEvent(
  eventId: string,
  statusFilter?: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'all'
): Promise<ApplicationData[]> {
  // First, get the event details including humanitix_event_id
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('id, title, venue, event_date, humanitix_event_id')
    .eq('id', eventId)
    .single();

  if (eventError) {
    console.error('Error fetching event:', eventError);
    throw eventError;
  }

  // Build OR filter: match by event_id OR by session_source_id (for availability-based applications)
  let orFilter = `event_id.eq.${eventId}`;
  if (eventData?.humanitix_event_id) {
    orFilter += `,session_source_id.eq.${eventData.humanitix_event_id}`;
  }

  console.log('[getApplicationsByEvent] eventId:', eventId);
  console.log('[getApplicationsByEvent] humanitix_event_id:', eventData?.humanitix_event_id);
  console.log('[getApplicationsByEvent] orFilter:', orFilter);

  let query = supabase
    .from('applications')
    .select(`
      id,
      comedian_id,
      event_id,
      session_source_id,
      status,
      message,
      spot_type,
      availability_confirmed,
      requirements_acknowledged,
      applied_at,
      responded_at,
      is_shortlisted,
      shortlisted_at,
      profiles!comedian_id (
        id,
        name,
        avatar_url,
        bio,
        years_experience
      )
    `)
    .or(orFilter);

  // Apply status filter if provided
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query.order('applied_at', { ascending: false });

  console.log('[getApplicationsByEvent] query result:', data?.length, 'applications', data);

  if (error) {
    console.error('Error fetching applications by event:', error);
    throw error;
  }

  return (data || []).map(app => ({
    id: app.id,
    comedian_id: app.comedian_id,
    comedian_name: app.profiles?.name || 'Unknown',
    comedian_avatar: app.profiles?.avatar_url,
    comedian_experience: app.profiles?.years_experience ? `${app.profiles.years_experience} years` : undefined,
    comedian_rating: undefined,
    event_id: app.event_id || eventId, // Use passed eventId if application has null event_id
    event_title: eventData?.title || 'Unknown Event',
    event_venue: eventData?.venue || 'Unknown Venue',
    event_date: eventData?.event_date || '',
    applied_at: app.applied_at || '',
    status: app.status || 'pending',
    message: app.message,
    spot_type: app.spot_type,
    availability_confirmed: app.availability_confirmed,
    requirements_acknowledged: app.requirements_acknowledged,
    is_shortlisted: app.is_shortlisted || false,
    shortlisted_at: app.shortlisted_at,
  }));
}

/**
 * Get directory availability entries for an event.
 * These come from the Google Forms avails import (directory_availability table)
 * and are shown alongside regular applications.
 */
export async function getDirectoryAvailsByEvent(eventId: string): Promise<ApplicationData[]> {
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('id, title, venue, event_date')
    .eq('id', eventId)
    .single();

  if (eventError) {
    console.error('Error fetching event for avails:', eventError);
    throw eventError;
  }

  const { data, error } = await supabase
    .from('directory_availability')
    .select(`
      id,
      directory_profile_id,
      event_id,
      available_date,
      show_name,
      notes,
      created_at,
      directory_profiles (
        id,
        stage_name,
        primary_headshot_url,
        slug
      )
    `)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching directory avails:', error);
    throw error;
  }

  return (data || []).map(avail => ({
    id: `avail-${avail.id}`,
    comedian_id: avail.directory_profile_id,
    comedian_name: avail.directory_profiles?.stage_name || 'Unknown',
    comedian_avatar: avail.directory_profiles?.primary_headshot_url ?? undefined,
    event_id: eventId,
    event_title: eventData?.title || 'Unknown Event',
    event_venue: eventData?.venue || 'Unknown Venue',
    event_date: eventData?.event_date || '',
    applied_at: avail.created_at || '',
    status: 'available' as const,
    message: avail.notes || 'Submitted via Avails Form',
    is_directory_avail: true,
  }));
}

/**
 * Get shortlist statistics for an event
 */
export interface ShortlistStats {
  total_applications: number;
  shortlisted_count: number;
  pending_shortlisted: number;
  accepted_shortlisted: number;
}

export async function getShortlistStats(eventId: string): Promise<ShortlistStats> {
  const applications = await getApplicationsByEvent(eventId);
  const shortlisted = applications.filter(app => app.is_shortlisted);

  return {
    total_applications: applications.length,
    shortlisted_count: shortlisted.length,
    pending_shortlisted: shortlisted.filter(app => app.status === 'pending').length,
    accepted_shortlisted: shortlisted.filter(app => app.status === 'accepted').length
  };
}
