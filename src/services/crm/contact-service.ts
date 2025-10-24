import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export type ContactRole = 'organizer' | 'venue_manager' | 'sponsor' | 'agency_manager';

export interface CRMContact {
  id: string;
  name: string;
  company?: string | null;
  title?: string | null;
  role: ContactRole;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
  serviceAreas?: string[] | null;
  specialties?: string[] | null;
  socialLinks?: Record<string, string> | null;
  totalEventsHosted?: number | null;
  successRate?: number | null;
  averageAttendance?: number | null;
  updatedAt?: string | null;
}

interface ProfileRecord {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  avatar_url: string | null;
  location: string | null;
  website_url: string | null;
  service_areas: string[] | null;
  specialties: string[] | null;
  social_media_links: Record<string, string> | null;
  updated_at: string | null;
  promoter_stats?: {
    total_events_hosted?: number | null;
    success_rate?: number | null;
    average_attendance?: number | null;
  } | null;
}

const buildDisplayName = (profile: ProfileRecord) => {
  if (profile.full_name) return profile.full_name;
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return 'Unnamed Contact';
};

const mapProfileToContact = (profile: ProfileRecord, role: ContactRole): CRMContact => ({
  id: profile.id,
  role,
  name: buildDisplayName(profile),
  company: profile.company_name,
  title: null,
  email: profile.contact_email,
  phone: profile.contact_phone,
  avatarUrl: profile.avatar_url,
  location: profile.location,
  websiteUrl: profile.website_url,
  serviceAreas: profile.service_areas,
  specialties: profile.specialties,
  socialLinks: profile.social_media_links,
  totalEventsHosted: profile.promoter_stats?.total_events_hosted ?? null,
  successRate: profile.promoter_stats?.success_rate ?? null,
  averageAttendance: profile.promoter_stats?.average_attendance ?? null,
  updatedAt: profile.updated_at,
});

export interface ContactQueryParams {
  role: ContactRole;
  search?: string;
  limit?: number;
}

export const contactService = {
  async list({ role, search, limit = 100 }: ContactQueryParams): Promise<CRMContact[]> {
    let query = supabaseClient
      .from('profiles')
      .select(
        `
          id,
          full_name,
          first_name,
          last_name,
          company_name,
          contact_email,
          contact_phone,
          avatar_url,
          location,
          website_url,
          service_areas,
          specialties,
          social_media_links,
          updated_at,
          promoter_stats:promoter_stats(total_events_hosted, success_rate, average_attendance),
          user_roles!inner(role)
        `
      )
      .eq('user_roles.role', role)
      .order('full_name', { ascending: true, nullsFirst: false })
      .limit(limit);

    if (search && search.trim().length > 0) {
      const term = search.trim();
      query = query.or(
        `full_name.ilike.%${term}%,company_name.ilike.%${term}%,contact_email.ilike.%${term}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    const rows = (data as ProfileRecord[] | null) ?? [];
    return rows.map((profile) => mapProfileToContact(profile, role));
  },
};

export type ContactService = typeof contactService;
