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

export interface SegmentWithId extends SegmentDefinition {
  id: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface UpdateSegmentInput {
  id: string;
  name?: string;
  color?: string | null;
  description?: string | null;
}

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

  async listWithDetails(): Promise<SegmentWithId[]> {
    const { data, error } = await supabase
      .from('segments')
      .select('id,slug,name,color,description,created_at,updated_at')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id as string,
      slug: row.slug as string,
      name: row.name as string,
      color: (row.color as string) ?? null,
      description: row.description as string | null,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string | undefined,
    }));
  },

  async create({ name, color }: CreateSegmentInput): Promise<SegmentDefinition> {
    if (!name.trim()) {
      throw new Error('Segment name is required');
    }

    return createSegmentRecord(name, color);
  },

  async update({ id, name, color, description }: UpdateSegmentInput): Promise<SegmentWithId> {
    const updates: Record<string, unknown> = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Segment name cannot be empty');
      }
      updates.name = trimmedName;
      updates.slug = ensureSlug(trimmedName);
    }

    if (color !== undefined) {
      updates.color = color ? normalizeHexColor(color) : null;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    const { data, error } = await supabase
      .from('segments')
      .update(updates)
      .eq('id', id)
      .select('id,slug,name,color,description,created_at,updated_at')
      .single();

    if (error) throw error;

    return {
      id: data.id as string,
      slug: data.slug as string,
      name: data.name as string,
      color: (data.color as string) ?? null,
      description: data.description as string | null,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string | undefined,
    };
  },

  async delete(id: string): Promise<void> {
    // First remove all members from this segment
    const { data: segment } = await supabase
      .from('segments')
      .select('slug')
      .eq('id', id)
      .single();

    if (segment) {
      await supabase
        .from('customer_segments')
        .delete()
        .eq('segment', segment.slug);
    }

    const { error } = await supabase
      .from('segments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCustomerCount(segmentSlug: string): Promise<number> {
    const { count, error } = await supabase
      .from('customer_segments')
      .select('*', { count: 'exact', head: true })
      .eq('segment', segmentSlug);

    if (error) throw error;
    return count ?? 0;
  },

  async getBySlug(slug: string): Promise<SegmentWithId | null> {
    const { data, error } = await supabase
      .from('segments')
      .select('id,slug,name,color,description,created_at,updated_at')
      .eq('slug', slug)
      .single();

    if (error) return null;

    return {
      id: data.id as string,
      slug: data.slug as string,
      name: data.name as string,
      color: (data.color as string) ?? null,
      description: data.description as string | null,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string | undefined,
    };
  },
};

export type SegmentServiceError = PostgrestError;
