import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;
const ORGANIZATION_TABLE = 'organizations';

export interface CRMOrganization {
  id: string;
  promoter_id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationInput {
  name: string;
  description?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website_url?: string;
  is_active?: boolean;
}

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;

export const organizationService = {
  async list(): Promise<CRMOrganization[]> {
    const { data, error } = await supabaseClient
      .from(ORGANIZATION_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as CRMOrganization[];
  },

  async create(
    promoterId: string,
    organizationData: CreateOrganizationInput
  ): Promise<CRMOrganization> {
    console.log('[Organization Service] Creating organization:', {
      promoterId,
      organizationData
    });

    const insertData = {
      ...organizationData,
      promoter_id: promoterId,
    };

    console.log('[Organization Service] Insert data:', insertData);

    const { data, error } = await supabaseClient
      .from(ORGANIZATION_TABLE)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[Organization Service] Insert failed:', error);
      throw error;
    }

    console.log('[Organization Service] Organization created successfully:', data);
    return data as CRMOrganization;
  },

  async update(
    id: string,
    updates: UpdateOrganizationInput
  ): Promise<CRMOrganization> {
    const { data, error } = await supabaseClient
      .from(ORGANIZATION_TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CRMOrganization;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabaseClient
      .from(ORGANIZATION_TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

