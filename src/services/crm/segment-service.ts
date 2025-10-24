import { supabase } from '@/integrations/supabase/client';
import type { SegmentDefinition } from '@/hooks/crm/customers/types';
import type { PostgrestError } from '@supabase/supabase-js';
import { ensureSlug } from '@/utils/slugify';

interface CreateSegmentInput {
  name: string;
  color?: string;
}

const normalizeHexColor = (value: string | undefined) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  const isValid = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(prefixed);
  if (!isValid) {
    throw new Error('Enter a hex colour like #A855F7 or #FFF');
  }
  return prefixed.toUpperCase();
};

const createSegmentRecord = async (name: string, color?: string) => {
  const trimmedName = name.trim();
  const normalizedColor = normalizeHexColor(color);
  const baseSlug = ensureSlug(trimmedName);

  let attempt = 0;

  while (attempt < 5) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;

    const { data, error } = await supabase
      .from('segments')
      .insert({
        slug,
        name: trimmedName,
        color: normalizedColor ?? null,
      })
      .select('slug,name,color')
      .single();

    if (!error) {
      return {
        slug: data.slug as string,
        name: data.name as string,
        color: (data.color as string) ?? null,
      } satisfies SegmentDefinition;
    }

    const pgError = error as PostgrestError;
    if (pgError?.code !== '23505') {
      throw error;
    }

    attempt += 1;
  }

  throw new Error('Segment name already exists. Please choose another name.');
};

export const segmentService = {
  async list(): Promise<SegmentDefinition[]> {
    const { data, error } = await supabase
      .from('segments')
      .select('slug,name,color')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map((row) => ({
      slug: row.slug as string,
      name: row.name as string,
      color: (row.color as string) ?? null,
    }));
  },

  async create({ name, color }: CreateSegmentInput): Promise<SegmentDefinition> {
    if (!name.trim()) {
      throw new Error('Segment name is required');
    }

    return createSegmentRecord(name, color);
  },
};

export type SegmentServiceError = PostgrestError;
