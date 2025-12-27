import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProfileType } from '@/types/universalProfile';

export interface ProfileSection {
  id?: string;
  section_id: string;
  display_order: number;
}

// Default section orders per profile type
const DEFAULT_SECTIONS: Record<ProfileType, ProfileSection[]> = {
  comedian: [
    { section_id: 'bio', display_order: 0 },
    { section_id: 'contact', display_order: 1 },
    { section_id: 'media', display_order: 2 },
    { section_id: 'shows', display_order: 3 },
    { section_id: 'accomplishments', display_order: 4 },
  ],
  comedian_lite: [
    { section_id: 'bio', display_order: 0 },
    { section_id: 'contact', display_order: 1 },
    { section_id: 'media', display_order: 2 },
    { section_id: 'shows', display_order: 3 },
    { section_id: 'accomplishments', display_order: 4 },
  ],
  organization: [
    { section_id: 'bio', display_order: 0 },
    { section_id: 'contact', display_order: 1 },
    { section_id: 'media', display_order: 2 },
    { section_id: 'events', display_order: 3 },
    { section_id: 'highlights', display_order: 4 },
  ],
  photographer: [
    { section_id: 'bio', display_order: 0 },
    { section_id: 'contact', display_order: 1 },
    { section_id: 'media', display_order: 2 },
    { section_id: 'highlights', display_order: 3 },
  ],
  videographer: [
    { section_id: 'bio', display_order: 0 },
    { section_id: 'contact', display_order: 1 },
    { section_id: 'media', display_order: 2 },
    { section_id: 'highlights', display_order: 3 },
  ],
  manager: [
    { section_id: 'bio', display_order: 0 },
    { section_id: 'contact', display_order: 1 },
    { section_id: 'highlights', display_order: 2 },
  ],
};

// Map profile types to their section order table names
const TABLE_NAMES: Record<ProfileType, string> = {
  comedian: 'comedian_section_order',
  comedian_lite: 'comedian_section_order',
  organization: 'organization_section_order',
  photographer: 'photographer_section_order',
  videographer: 'videographer_section_order',
  manager: 'manager_section_order',
};

export function useProfileSectionOrder(
  profileType: ProfileType,
  profileId: string,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();
  const tableName = TABLE_NAMES[profileType];
  const defaultSections = DEFAULT_SECTIONS[profileType];

  // Determine the ID column name based on profile type
  const idColumn = profileType === 'organization' ? 'organization_id' : 'user_id';

  // Fetch section order
  const { data: sections = defaultSections, isLoading } = useQuery({
    queryKey: ['profile-section-order', profileType, profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idColumn, profileId)
        .order('display_order');

      if (error) {
        // If table doesn't exist yet, return defaults
        if (error.code === '42P01') {
          console.warn(`Table ${tableName} does not exist yet. Using default section order.`);
          return defaultSections;
        }
        throw error;
      }

      // If no custom order, return defaults
      if (!data || data.length === 0) {
        return defaultSections;
      }

      return data as ProfileSection[];
    },
    enabled: enabled && !!profileId,
  });

  // Update section order
  const updateSectionOrder = useMutation({
    mutationFn: async ({ section_id, display_order }: { section_id: string; display_order: number }) => {
      const { error } = await supabase
        .from(tableName)
        .upsert({
          [idColumn]: profileId,
          section_id,
          display_order,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: `${idColumn},section_id`
        });

      if (error) {
        // If table doesn't exist, log warning but don't throw
        if (error.code === '42P01') {
          console.warn(`Table ${tableName} does not exist yet. Section ordering will not be persisted.`);
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-section-order', profileType, profileId] });
    },
  });

  // Batch update all sections
  const updateAllSections = async (newSections: ProfileSection[]) => {
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
