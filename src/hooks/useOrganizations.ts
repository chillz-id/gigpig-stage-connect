/**
 * @deprecated Use useOrganizationProfiles instead. This hook provides backward
 * compatibility for legacy code that used the old 'organizations' table.
 * The underlying data now comes from 'organization_profiles'.
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Organization {
  id: string;
  promoter_id: string; // Maps to owner_id
  name: string; // Maps to organization_name
  description?: string; // Maps to bio
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationData {
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

// Map organization_profiles row to legacy Organization format
function mapToLegacyFormat(row: Record<string, unknown>): Organization {
  return {
    id: row.id as string,
    promoter_id: row.owner_id as string,
    name: row.organization_name as string,
    description: row.bio as string | undefined,
    logo_url: row.logo_url as string | undefined,
    contact_email: row.contact_email as string | undefined,
    contact_phone: row.contact_phone as string | undefined,
    address: row.address as string | undefined,
    city: row.city as string | undefined,
    state: row.state as string | undefined,
    country: row.country as string | undefined,
    website_url: row.website_url as string | undefined,
    is_active: row.is_active as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export const useOrganizations = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizations = [], isLoading, error } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_profiles')
        .select('id, owner_id, organization_name, bio, logo_url, contact_email, contact_phone, address, city, state, country, website_url, is_active, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToLegacyFormat);
    },
  });

  const createOrganization = async (organizationData: CreateOrganizationData) => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate a unique ID for the organization profile
      const orgId = crypto.randomUUID();

      // First create a base profile for the organization
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: orgId,
          full_name: organizationData.name,
          email: organizationData.contact_email || `org-${orgId}@placeholder.local`,
        });

      if (profileError) throw profileError;

      // Create organization profile with mapped fields
      const { data, error } = await supabase
        .from('organization_profiles')
        .insert({
          id: orgId,
          owner_id: user.id,
          organization_name: organizationData.name,
          bio: organizationData.description,
          logo_url: organizationData.logo_url,
          contact_email: organizationData.contact_email || `org-${orgId}@placeholder.local`,
          contact_phone: organizationData.contact_phone,
          address: organizationData.address,
          city: organizationData.city,
          state: organizationData.state,
          country: organizationData.country || 'Australia',
          website_url: organizationData.website_url,
          is_active: organizationData.is_active ?? true,
          organization_type: ['event_promoter'], // Default type
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization-profiles'] });

      toast({
        title: "Organization created",
        description: "Your organization has been created successfully.",
      });

      return mapToLegacyFormat(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error creating organization",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const updateOrganization = async (id: string, updates: Partial<CreateOrganizationData>) => {
    setIsUpdating(true);
    try {
      // Map legacy field names to organization_profiles fields
      const mappedUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) mappedUpdates.organization_name = updates.name;
      if (updates.description !== undefined) mappedUpdates.bio = updates.description;
      if (updates.logo_url !== undefined) mappedUpdates.logo_url = updates.logo_url;
      if (updates.contact_email !== undefined) mappedUpdates.contact_email = updates.contact_email;
      if (updates.contact_phone !== undefined) mappedUpdates.contact_phone = updates.contact_phone;
      if (updates.address !== undefined) mappedUpdates.address = updates.address;
      if (updates.city !== undefined) mappedUpdates.city = updates.city;
      if (updates.state !== undefined) mappedUpdates.state = updates.state;
      if (updates.country !== undefined) mappedUpdates.country = updates.country;
      if (updates.website_url !== undefined) mappedUpdates.website_url = updates.website_url;
      if (updates.is_active !== undefined) mappedUpdates.is_active = updates.is_active;

      const { data, error } = await supabase
        .from('organization_profiles')
        .update(mappedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization-profiles'] });

      toast({
        title: "Organization updated",
        description: "Your organization has been updated successfully.",
      });

      return mapToLegacyFormat(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error updating organization",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteOrganization = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('organization_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization-profiles'] });

      toast({
        title: "Organization deleted",
        description: "Your organization has been deleted successfully.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error deleting organization",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    organizations,
    isLoading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  };
};
