
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Organization {
  id: string;
  promoter_id: string;
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
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Organization[];
    },
  });

  const createOrganization = async (organizationData: CreateOrganizationData) => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          ...organizationData,
          promoter_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      
      toast({
        title: "Organization created",
        description: "Your organization has been created successfully.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error creating organization",
        description: error.message,
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
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      
      toast({
        title: "Organization updated",
        description: "Your organization has been updated successfully.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error updating organization",
        description: error.message,
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
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      
      toast({
        title: "Organization deleted",
        description: "Your organization has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting organization",
        description: error.message,
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
