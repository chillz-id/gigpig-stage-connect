// src/hooks/useSlugValidation.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateSlug } from '@/utils/slugify';

type ProfileType = 'comedian' | 'manager' | 'organization' | 'venue';

const PROFILE_TABLE_MAP: Record<ProfileType, string> = {
  comedian: 'comedians',
  manager: 'managers',
  organization: 'organizations',
  venue: 'venues',
};

export function useSlugValidation(
  slug: string,
  profileType: ProfileType,
  currentProfileId?: string
) {
  const [isValid, setIsValid] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    const checkSlug = async () => {
      // Skip if empty
      if (!slug) {
        setIsValid(false);
        setError(undefined);
        return;
      }

      setIsChecking(true);

      // First validate format
      const formatValidation = validateSlug(slug);
      if (!formatValidation.valid) {
        setIsValid(false);
        setError(formatValidation.error);
        setIsChecking(false);
        return;
      }

      // Then check uniqueness in database
      const tableName = PROFILE_TABLE_MAP[profileType];
      let query = supabase
        .from(tableName as any)
        .select('id')
        .eq('url_slug', slug);

      // Exclude current profile if editing
      if (currentProfileId) {
        query = query.neq('id', currentProfileId);
      }

      const { data, error: dbError } = await query.single();

      if (dbError && dbError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (good)
        setIsValid(false);
        setError('Error checking slug availability');
        setIsChecking(false);
        return;
      }

      if (data) {
        setIsValid(false);
        setError('This URL slug is already taken');
        setIsChecking(false);
        return;
      }

      setIsValid(true);
      setError(undefined);
      setIsChecking(false);
    };

    // Debounce the check
    const timeoutId = setTimeout(checkSlug, 300);
    return () => clearTimeout(timeoutId);
  }, [slug, profileType, currentProfileId]);

  return { isValid, error, isChecking };
}
