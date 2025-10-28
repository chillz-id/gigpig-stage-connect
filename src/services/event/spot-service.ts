import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { calculateGST, type GSTMode } from '@/utils/gst-calculator';

const supabaseClient = supabase as any;

export type EventSpot = Tables<'event_spots'>;
export type EventSpotInsert = TablesInsert<'event_spots'>;
export type EventSpotUpdate = TablesUpdate<'event_spots'>;

export const eventSpotService = {
  async listByEvent(eventId: string): Promise<EventSpot[]> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .select('*')
      .eq('event_id', eventId)
      .order('spot_order', { ascending: true });

    if (error) throw error;
    return (data as EventSpot[] | null) ?? [];
  },

  async create(payload: EventSpotInsert): Promise<EventSpot> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as EventSpot;
  },

  async update(id: string, updates: EventSpotUpdate): Promise<EventSpot> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as EventSpot;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabaseClient
      .from('event_spots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async hasPerformer(eventId: string, performerId: string): Promise<boolean> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .select('id')
      .eq('event_id', eventId)
      .eq('performer_id', performerId);

    if (error) throw error;
    return data !== null && data.length > 0;
  },

  async reorder(spots: Array<{ id?: string | null; order: number }>): Promise<void> {
    const updatePromises = spots
      .filter((spot) => spot.id)
      .map((spot) =>
        supabaseClient
          .from('event_spots')
          .update({ order_number: spot.order })
          .eq('id', spot.id)
      );

    const results = await Promise.all(updatePromises);
    const firstError = results.find((result) => result.error)?.error;

    if (firstError) throw firstError;
  },

  // ============================================================================
  // PAYMENT & TAX MANAGEMENT
  // ============================================================================

  /**
   * Update payment details for a spot with automatic tax calculation
   * If tax_included is true: amount is gross (includes tax)
   * If tax_included is false: amount is net (tax excluded)
   */
  async updatePayment(
    spotId: string,
    payment: {
      payment_amount: number;
      tax_included: boolean;
      tax_rate: number;
      payment_notes?: string;
      payment_status?: 'unpaid' | 'pending' | 'paid' | 'partially_paid' | 'refunded';
    }
  ): Promise<EventSpot> {
    // Calculate tax breakdown
    const breakdown = this.calculateTaxBreakdown(
      payment.payment_amount,
      payment.tax_included,
      payment.tax_rate
    );

    const { data, error } = await supabaseClient
      .from('event_spots')
      .update({
        payment_amount: payment.payment_amount,
        tax_included: payment.tax_included,
        tax_rate: payment.tax_rate,
        payment_gross: breakdown.gross,
        payment_net: breakdown.net,
        payment_tax: breakdown.tax,
        payment_notes: payment.payment_notes,
        payment_status: payment.payment_status || 'unpaid',
        is_paid: payment.payment_status === 'paid'
      })
      .eq('id', spotId)
      .select()
      .single();

    if (error) throw error;
    return data as EventSpot;
  },

  /**
   * Calculate tax breakdown
   * Returns gross, net, and tax amounts
   */
  calculateTaxBreakdown(
    amount: number,
    taxIncluded: boolean,
    taxRate: number
  ): { gross: number; net: number; tax: number } {
    if (taxIncluded) {
      // Amount is gross, calculate net and tax
      const net = Math.round((amount / (1 + taxRate / 100)) * 100) / 100;
      const tax = Math.round((amount - net) * 100) / 100;
      return { gross: amount, net, tax };
    } else {
      // Amount is net, calculate gross and tax
      const tax = Math.round((amount * taxRate / 100) * 100) / 100;
      const gross = Math.round((amount + tax) * 100) / 100;
      return { gross, net: amount, tax };
    }
  },

  /**
   * Bulk update payment status for multiple spots
   */
  async bulkUpdatePaymentStatus(
    spotIds: string[],
    status: 'unpaid' | 'pending' | 'paid' | 'partially_paid' | 'refunded'
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('event_spots')
      .update({
        payment_status: status,
        is_paid: status === 'paid'
      })
      .in('id', spotIds);

    if (error) throw error;
  },

  /**
   * Mark spot as paid
   */
  async markAsPaid(spotId: string): Promise<EventSpot> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .update({
        payment_status: 'paid',
        is_paid: true
      })
      .eq('id', spotId)
      .select()
      .single();

    if (error) throw error;
    return data as EventSpot;
  },

  /**
   * Get unpaid spots for an event
   */
  async getUnpaidSpots(eventId: string): Promise<EventSpot[]> {
    const { data, error } = await supabaseClient
      .from('event_spots')
      .select('*')
      .eq('event_id', eventId)
      .neq('payment_status', 'paid')
      .order('spot_order', { ascending: true });

    if (error) throw error;
    return (data as EventSpot[] | null) ?? [];
  },

  /**
   * Get payment statistics for an event
   */
  async getPaymentStats(eventId: string): Promise<{
    total_spots: number;
    paid_spots: number;
    unpaid_spots: number;
    total_gross: number;
    total_net: number;
    total_tax: number;
    paid_gross: number;
    unpaid_gross: number;
  }> {
    const spots = await this.listByEvent(eventId);

    const stats = {
      total_spots: spots.length,
      paid_spots: 0,
      unpaid_spots: 0,
      total_gross: 0,
      total_net: 0,
      total_tax: 0,
      paid_gross: 0,
      unpaid_gross: 0
    };

    spots.forEach(spot => {
      // Count payment status
      if (spot.payment_status === 'paid') {
        stats.paid_spots++;
        stats.paid_gross += spot.payment_gross || 0;
      } else {
        stats.unpaid_spots++;
        stats.unpaid_gross += spot.payment_gross || 0;
      }

      // Sum amounts
      stats.total_gross += spot.payment_gross || 0;
      stats.total_net += spot.payment_net || 0;
      stats.total_tax += spot.payment_tax || 0;
    });

    return stats;
  },

  /**
   * Toggle tax included/excluded for a spot
   * Recalculates breakdown based on new setting
   */
  async toggleTaxIncluded(spotId: string): Promise<EventSpot> {
    // Get current spot
    const { data: spot, error: fetchError } = await supabaseClient
      .from('event_spots')
      .select('*')
      .eq('id', spotId)
      .single();

    if (fetchError) throw fetchError;

    const currentSpot = spot as EventSpot;
    const newTaxIncluded = !currentSpot.tax_included;
    const amount = currentSpot.payment_amount || 0;

    // Recalculate with new tax setting
    const updatePayload: {
      payment_amount: number;
      tax_included: boolean;
      tax_rate: number;
      payment_notes?: string;
      payment_status?: 'paid' | 'unpaid' | 'pending' | 'partially_paid' | 'refunded';
    } = {
      payment_amount: amount,
      tax_included: newTaxIncluded,
      tax_rate: currentSpot.tax_rate || 10,
    };

    if (currentSpot.payment_notes) {
      updatePayload.payment_notes = currentSpot.payment_notes;
    }
    if (currentSpot.payment_status) {
      updatePayload.payment_status = currentSpot.payment_status as any;
    }

    return this.updatePayment(spotId, updatePayload);
  },

  /**
   * Apply tax rate to all spots in an event
   */
  async applyTaxRateToEvent(
    eventId: string,
    taxRate: number,
    taxIncluded: boolean
  ): Promise<void> {
    const spots = await this.listByEvent(eventId);

    const updatePromises = spots
      .filter(spot => spot.payment_amount && spot.payment_amount > 0)
      .map(spot => {
        const updatePayload: {
          payment_amount: number;
          tax_included: boolean;
          tax_rate: number;
          payment_notes?: string;
          payment_status?: 'paid' | 'unpaid' | 'pending' | 'partially_paid' | 'refunded';
        } = {
          payment_amount: spot.payment_amount!,
          tax_included: taxIncluded,
          tax_rate: taxRate,
        };

        if (spot.payment_notes) {
          updatePayload.payment_notes = spot.payment_notes;
        }
        if (spot.payment_status) {
          updatePayload.payment_status = spot.payment_status as any;
        }

        return this.updatePayment(spot.id, updatePayload);
      });

    await Promise.all(updatePromises);
  },

  // ============================================================================
  // GST-SPECIFIC PAYMENT METHODS
  // ============================================================================

  async updateSpotPayment(
    spotId: string,
    paymentData: {
      payment_gross?: number;
      payment_tax?: number;
      payment_net?: number;
      payment_status?: 'unpaid' | 'pending' | 'paid';
      gst_mode?: GSTMode;
      payment_notes?: string;
    }
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('event_spots')
      .update(paymentData)
      .eq('id', spotId);

    if (error) throw error;
  },

  async updatePaymentStatus(
    spotId: string,
    status: 'unpaid' | 'pending' | 'paid'
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('event_spots')
      .update({ payment_status: status })
      .eq('id', spotId);

    if (error) throw error;
  },

  async calculateAndSetSpotPayment(
    spotId: string,
    amount: number,
    gstMode: GSTMode
  ): Promise<void> {
    const gstCalc = calculateGST(amount, gstMode);

    const { error } = await supabaseClient
      .from('event_spots')
      .update({
        payment_gross: gstCalc.gross,
        payment_tax: gstCalc.tax,
        payment_net: gstCalc.net,
        gst_mode: gstMode,
      })
      .eq('id', spotId);

    if (error) throw error;
  },
};

export type EventSpotService = typeof eventSpotService;
