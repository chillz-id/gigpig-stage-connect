/**
 * Hook for managing social automation rules.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AutomationRule } from '@/types/social';

const RULES_KEY = 'social-automation-rules';

/**
 * Fetch automation rules for an organization.
 */
export function useAutomationRules(organizationId: string | undefined) {
  return useQuery({
    queryKey: [RULES_KEY, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_automation_rules')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as AutomationRule[];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new automation rule.
 */
export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('social_automation_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as AutomationRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RULES_KEY] });
    },
  });
}

/**
 * Update an automation rule.
 */
export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutomationRule> }) => {
      const { data, error } = await supabase
        .from('social_automation_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as AutomationRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RULES_KEY] });
    },
  });
}

/**
 * Delete an automation rule.
 */
export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('social_automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RULES_KEY] });
    },
  });
}

/**
 * Toggle a rule's active state.
 */
export function useToggleRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('social_automation_rules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RULES_KEY] });
    },
  });
}
