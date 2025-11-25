import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EPKSection {
  id: string;
  section_id: string;
  display_order: number;
}

const DEFAULT_SECTION_ORDER = [
  { section_id: 'bio', display_order: 0 }, // Locked
  { section_id: 'contact', display_order: 1 },
  { section_id: 'media', display_order: 2 },
  { section_id: 'shows', display_order: 3 },
  { section_id: 'accomplishments', display_order: 4 },
];

export function useEPKSectionOrder(userId: string) {
  const queryClient = useQueryClient();

  // Fetch section order
  const { data: sections = DEFAULT_SECTION_ORDER, isLoading } = useQuery({
    queryKey: ['epk-section-order', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comedian_section_order')
        .select('*')
        .eq('user_id', userId)
        .order('display_order');

      if (error) throw error;

      // If no custom order, return defaults
      if (!data || data.length === 0) {
        return DEFAULT_SECTION_ORDER;
      }

      return data;
    },
    enabled: !!userId,
  });

  // Update section order
  const updateSectionOrder = useMutation({
    mutationFn: async ({ section_id, display_order }: { section_id: string; display_order: number }) => {
      const { error } = await supabase
        .from('comedian_section_order')
        .upsert({
          user_id: userId,
          section_id,
          display_order,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,section_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epk-section-order', userId] });
    },
  });

  // Batch update all sections
  const updateAllSections = async (newSections: EPKSection[]) => {
    for (const section of newSections) {
      await updateSectionOrder.mutateAsync({
        section_id: section.section_id,
        display_order: section.display_order,
      });
    }
  };

  return {
    sections,
    isLoading,
    updateSectionOrder: updateSectionOrder.mutate,
    updateAllSections,
  };
}
