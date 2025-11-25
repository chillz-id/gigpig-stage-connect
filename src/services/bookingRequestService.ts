/**
 * Booking Request Service
 *
 * Centralized service for booking request CRUD operations.
 * Handles requests from promoters/venues to book comedians.
 *
 * Tables involved:
 * - booking_requests: Main request table
 * - booking_request_responses: Comedian responses to requests
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface BookingRequest {
  id: string;
  requester_id: string;
  event_date: string;
  event_time: string;
  venue: string;
  budget?: number;
  requested_comedian_id?: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'completed';
  created_at: string;
  event_title?: string;
  event_type?: string;
  expected_audience_size?: number;
  performance_duration?: number;
  technical_requirements?: string;
}

export interface BookingRequestResponse {
  id: string;
  booking_request_id: string;
  comedian_id: string;
  response_type: 'accepted' | 'declined' | 'negotiating' | 'interested';
  proposed_fee?: number;
  counter_offer_notes?: string;
  response_message?: string;
  created_at: string;
}

export interface BookingRequestWithResponses extends BookingRequest {
  responses: Array<BookingRequestResponse & {
    comedian: {
      id: string;
      name: string;
      email: string;
      profile_image_url?: string;
      bio?: string;
      stage_name?: string;
    };
  }>;
}

export interface CreateBookingRequestData {
  requester_id: string;
  event_date: string;
  event_time: string;
  venue: string;
  budget?: number;
  requested_comedian_id?: string;
  notes?: string;
  event_title?: string;
  event_type?: string;
  expected_audience_size?: number;
  performance_duration?: number;
  technical_requirements?: string;
}

export interface CreateBookingResponseData {
  booking_request_id: string;
  comedian_id: string;
  response_type: 'accepted' | 'declined' | 'negotiating' | 'interested';
  proposed_fee?: number;
  counter_offer_notes?: string;
  response_message?: string;
}

export type BookingRequestStatus = 'pending' | 'accepted' | 'cancelled' | 'completed';

// ============================================================================
// Service
// ============================================================================

export const bookingRequestService = {
  /**
   * Create a new booking request
   */
  async create(data: CreateBookingRequestData): Promise<BookingRequest> {
    const { data: result, error } = await supabase
      .from('booking_requests')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking request:', error);
      throw new Error(`Failed to create booking request: ${error.message}`);
    }

    return result as BookingRequest;
  },

  /**
   * Get a booking request by ID
   */
  async getById(id: string): Promise<BookingRequest | null> {
    const { data, error } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching booking request:', error);
      throw new Error(`Failed to fetch booking request: ${error.message}`);
    }

    return data as BookingRequest;
  },

  /**
   * Get a booking request with all responses
   */
  async getByIdWithResponses(id: string): Promise<BookingRequestWithResponses | null> {
    const { data, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        responses:booking_request_responses(
          *,
          comedian:profiles!booking_request_responses_comedian_id_fkey(
            id,
            name,
            email,
            profile_image_url,
            bio,
            stage_name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching booking request with responses:', error);
      throw new Error(`Failed to fetch booking request: ${error.message}`);
    }

    return data as BookingRequestWithResponses;
  },

  /**
   * List booking requests for a requester (promoter/venue)
   */
  async listByRequester(
    requesterId: string,
    status?: BookingRequestStatus | BookingRequestStatus[]
  ): Promise<BookingRequestWithResponses[]> {
    let query = supabase
      .from('booking_requests')
      .select(`
        *,
        responses:booking_request_responses(
          *,
          comedian:profiles!booking_request_responses_comedian_id_fkey(
            id,
            name,
            email,
            profile_image_url,
            bio,
            stage_name
          )
        )
      `)
      .eq('requester_id', requesterId)
      .order('created_at', { ascending: false });

    if (status) {
      if (Array.isArray(status)) {
        query = query.in('status', status);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing booking requests:', error);
      throw new Error(`Failed to list booking requests: ${error.message}`);
    }

    return (data || []) as BookingRequestWithResponses[];
  },

  /**
   * List booking requests available to a comedian
   * (direct requests + open/general requests)
   */
  async listForComedian(
    comedianId: string,
    status: BookingRequestStatus = 'pending'
  ): Promise<BookingRequest[]> {
    const { data, error } = await supabase
      .from('booking_requests')
      .select('*')
      .or(`requested_comedian_id.eq.${comedianId},requested_comedian_id.is.null`)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing comedian booking requests:', error);
      throw new Error(`Failed to list booking requests: ${error.message}`);
    }

    return (data || []) as BookingRequest[];
  },

  /**
   * Update booking request status
   */
  async updateStatus(
    id: string,
    status: BookingRequestStatus,
    updates?: Partial<Pick<BookingRequest, 'requested_comedian_id'>>
  ): Promise<BookingRequest> {
    const { data, error } = await supabase
      .from('booking_requests')
      .update({ status, ...updates })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking request status:', error);
      throw new Error(`Failed to update booking request: ${error.message}`);
    }

    return data as BookingRequest;
  },

  /**
   * Accept a comedian's response to a booking request
   * Updates the request status and optionally notifies the comedian
   */
  async acceptComedianResponse(
    requestId: string,
    comedianId: string,
    notify: boolean = true
  ): Promise<BookingRequest> {
    // Update the booking request
    const request = await this.updateStatus(requestId, 'accepted', {
      requested_comedian_id: comedianId,
    });

    // Create notification for the comedian
    if (notify) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: comedianId,
          type: 'booking_accepted',
          title: 'Booking Request Accepted',
          message: 'Your response to a booking request has been accepted!',
          link: `/bookings/${requestId}`,
          metadata: { booking_request_id: requestId },
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't throw - the booking was still accepted
      }
    }

    return request;
  },

  /**
   * Cancel a booking request
   */
  async cancel(id: string): Promise<BookingRequest> {
    return this.updateStatus(id, 'cancelled');
  },

  /**
   * Mark a booking request as completed
   */
  async complete(id: string): Promise<BookingRequest> {
    return this.updateStatus(id, 'completed');
  },

  // ============================================================================
  // Response Operations
  // ============================================================================

  /**
   * Submit or update a comedian's response to a booking request
   */
  async submitResponse(data: CreateBookingResponseData): Promise<BookingRequestResponse> {
    const { data: result, error } = await supabase
      .from('booking_request_responses')
      .upsert(data, {
        onConflict: 'booking_request_id,comedian_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting booking response:', error);
      throw new Error(`Failed to submit response: ${error.message}`);
    }

    return result as BookingRequestResponse;
  },

  /**
   * Get all responses for a booking request
   */
  async getResponses(bookingRequestId: string): Promise<BookingRequestResponse[]> {
    const { data, error } = await supabase
      .from('booking_request_responses')
      .select('*')
      .eq('booking_request_id', bookingRequestId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching booking responses:', error);
      throw new Error(`Failed to fetch responses: ${error.message}`);
    }

    return (data || []) as BookingRequestResponse[];
  },

  /**
   * Get a comedian's response to a specific request
   */
  async getComedianResponse(
    bookingRequestId: string,
    comedianId: string
  ): Promise<BookingRequestResponse | null> {
    const { data, error } = await supabase
      .from('booking_request_responses')
      .select('*')
      .eq('booking_request_id', bookingRequestId)
      .eq('comedian_id', comedianId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching comedian response:', error);
      throw new Error(`Failed to fetch response: ${error.message}`);
    }

    return data as BookingRequestResponse;
  },
};

export type BookingRequestService = typeof bookingRequestService;
