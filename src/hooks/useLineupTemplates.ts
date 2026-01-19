/**
 * useLineupTemplates Hook
 *
 * Manages lineup templates for organizations.
 * - List organization's saved templates
 * - Save current lineup as a template
 * - Load a template into an event
 * - Delete templates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { LineupTemplate, LineupTemplateSpot, SpotData } from '@/types/spot';

/**
 * List all lineup templates for an organization
 */
export function useLineupTemplates(organizationId?: string | null) {
  return useQuery({
    queryKey: ['lineup-templates', organizationId],
    queryFn: async (): Promise<LineupTemplate[]> => {
      if (!organizationId) throw new Error('No organization selected');

      const { data, error } = await supabase
        .from('lineup_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Parse JSONB spots field
      return (data || []).map((template) => ({
        ...template,
        spots: (template.spots as LineupTemplateSpot[]) || [],
      }));
    },
    enabled: !!organizationId,
  });
}

/**
 * Get a single template by ID
 */
export function useLineupTemplate(templateId: string | null) {
  return useQuery({
    queryKey: ['lineup-template', templateId],
    queryFn: async (): Promise<LineupTemplate | null> => {
      if (!templateId) return null;

      const { data, error } = await supabase
        .from('lineup_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      return {
        ...data,
        spots: (data.spots as LineupTemplateSpot[]) || [],
      };
    },
    enabled: !!templateId,
  });
}

interface SaveTemplateInput {
  name: string;
  description?: string;
  spots: SpotData[];
  includePayments?: boolean;
  organizationId?: string;
}

/**
 * Convert SpotData array to LineupTemplateSpot array
 * Supports both SpotData (category, label, type) and raw DB records (spot_category, spot_name)
 */
function spotsToTemplateSpots(
  spots: SpotData[],
  includePayments = true
): LineupTemplateSpot[] {
  return spots.map((spot, index) => {
    // Support both SpotData (category, label) and raw DB records (spot_category, spot_name)
    const rawSpot = spot as unknown as {
      spot_category?: string;
      spot_name?: string;
    };
    const category = rawSpot.spot_category || spot.category || 'act';
    const spotName = rawSpot.spot_name || spot.label;

    // For extras, duration_minutes should be 0 (they use hours field instead)
    const isExtra = spot.spot_type === 'extra';
    const templateSpot: LineupTemplateSpot = {
      position: index + 1,
      spot_type: spot.spot_type || 'act',
      category: category as 'act' | 'doors' | 'intermission' | 'custom',
      duration_minutes: isExtra ? 0 : (spot.duration_minutes || 10),
    };

    // Add type for acts (use spot_name for raw DB records)
    if (category === 'act' && spot.spot_type !== 'extra') {
      templateSpot.type = (spotName as 'MC' | 'Feature' | 'Headliner' | 'Spot' | 'Guest') || spot.type;
    }

    // Add extra_type for extras
    if (spot.spot_type === 'extra' && spot.extra_type) {
      templateSpot.extra_type = spot.extra_type;
      templateSpot.rate_type = spot.rate_type;
      templateSpot.hours = spot.hours;
    }

    // Add label for breaks (use spot_name for raw DB records)
    if (category !== 'act' && spotName) {
      templateSpot.label = spotName;
    }

    // Add start_time_mode for breaks
    if (category !== 'act' && spot.start_time_mode) {
      templateSpot.start_time_mode = spot.start_time_mode;
    }

    // Optionally include payments
    if (includePayments && spot.payment_amount) {
      templateSpot.payment_amount = spot.payment_amount;
    }

    // Include notes if present
    if (spot.notes) {
      templateSpot.notes = spot.notes;
    }

    return templateSpot;
  });
}

/**
 * Save current lineup as a template
 */
export function useSaveLineupTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      spots,
      includePayments = true,
      organizationId,
    }: SaveTemplateInput): Promise<LineupTemplate> => {
      if (!organizationId) throw new Error('No organization selected');

      const templateSpots = spotsToTemplateSpots(spots, includePayments);

      const { data, error } = await supabase
        .from('lineup_templates')
        .insert({
          organization_id: organizationId,
          name,
          description,
          spots: templateSpots,
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate name error
        if (error.code === '23505') {
          throw new Error(`A template named "${name}" already exists`);
        }
        throw error;
      }

      return {
        ...data,
        spots: templateSpots,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineup-templates', variables.organizationId] });
      toast({
        title: 'Template Saved',
        description: 'Lineup template has been saved successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'Failed to save template',
      });
    },
  });
}

interface LoadTemplateInput {
  eventId: string;
  templateId: string;
  replaceExisting?: boolean;
}

interface LoadTemplateResult {
  spots_created: number;
}

/**
 * Load a template into an event (creates spots from template)
 */
export function useLoadLineupTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      templateId,
      replaceExisting = true,
    }: LoadTemplateInput): Promise<LoadTemplateResult> => {
      const { data, error } = await supabase.rpc('load_lineup_template', {
        p_event_id: eventId,
        p_template_id: templateId,
        p_replace_existing: replaceExisting,
      });

      if (error) throw error;

      // RPC returns array with one row
      const result = Array.isArray(data) ? data[0] : data;
      return result as LoadTemplateResult;
    },
    onSuccess: (result, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-spots', eventId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-stats', eventId] });
      queryClient.invalidateQueries({
        queryKey: ['lineup-publish-status', eventId],
      });
      toast({
        title: 'Template Loaded',
        description: `Created ${result.spots_created} spots from template.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Load Failed',
        description: error.message || 'Failed to load template',
      });
    },
  });
}

interface UpdateTemplateInput extends SaveTemplateInput {
  id: string;
}

/**
 * Update an existing template
 */
export function useUpdateLineupTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      spots,
      includePayments = true,
    }: UpdateTemplateInput): Promise<LineupTemplate> => {
      const templateSpots = spots
        ? spotsToTemplateSpots(spots, includePayments)
        : undefined;

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (templateSpots !== undefined) updateData.spots = templateSpots;

      const { data, error } = await supabase
        .from('lineup_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        spots: (data.spots as LineupTemplateSpot[]) || [],
      };
    },
    onSuccess: (_, { id, organizationId }) => {
      queryClient.invalidateQueries({ queryKey: ['lineup-templates', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['lineup-template', id] });
      toast({
        title: 'Template Updated',
        description: 'Lineup template has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update template',
      });
    },
  });
}

interface DeleteTemplateInput {
  templateId: string;
  organizationId: string;
}

/**
 * Delete a template
 */
export function useDeleteLineupTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ templateId }: DeleteTemplateInput): Promise<void> => {
      const { error } = await supabase
        .from('lineup_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({ queryKey: ['lineup-templates', organizationId] });
      toast({
        title: 'Template Deleted',
        description: 'Lineup template has been deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete template',
      });
    },
  });
}

export default useLineupTemplates;
