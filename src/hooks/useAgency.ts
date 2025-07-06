// React hooks for agency management operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  agencyService,
  managerService,
  artistManagementService,
  dealService,
  dealMessagesService,
  analyticsService
} from '../services/agencyService';
import type {
  Agency,
  ManagerProfile,
  ArtistManagement,
  DealNegotiation,
  DealMessage,
  AgencyAnalytics,
  AgencyDashboardData,
  CreateAgencyRequest,
  CreateManagerProfileRequest,
  CreateArtistManagementRequest,
  CreateDealNegotiationRequest,
  UpdateDealStatusRequest,
  SendDealMessageRequest,
  AgencyFilters,
  DealFilters,
  ArtistManagementFilters,
  PaginationParams
} from '../types/agency';

// Agency hooks
export const useAgencies = (filters: AgencyFilters = {}, pagination: PaginationParams = {}) => {
  return useQuery({
    queryKey: ['agencies', filters, pagination],
    queryFn: () => agencyService.getAgencies(filters, pagination),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAgency = (id: string) => {
  return useQuery({
    queryKey: ['agency', id],
    queryFn: () => agencyService.getAgency(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserAgencies = () => {
  return useQuery({
    queryKey: ['user-agencies'],
    queryFn: () => agencyService.getUserAgencies(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateAgency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAgencyRequest) => agencyService.createAgency(data),
    onSuccess: (newAgency) => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      queryClient.invalidateQueries({ queryKey: ['user-agencies'] });
      toast.success('Agency created successfully!');
    },
    onError: (error) => {
      console.error('Error creating agency:', error);
      toast.error('Failed to create agency. Please try again.');
    },
  });
};

export const useUpdateAgency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Agency> }) =>
      agencyService.updateAgency(id, updates),
    onSuccess: (updatedAgency) => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      queryClient.invalidateQueries({ queryKey: ['agency', updatedAgency.id] });
      queryClient.invalidateQueries({ queryKey: ['user-agencies'] });
      toast.success('Agency updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating agency:', error);
      toast.error('Failed to update agency. Please try again.');
    },
  });
};

export const useDeleteAgency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => agencyService.deleteAgency(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      queryClient.invalidateQueries({ queryKey: ['user-agencies'] });
      toast.success('Agency deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting agency:', error);
      toast.error('Failed to delete agency. Please try again.');
    },
  });
};

// Manager hooks
export const useAgencyManagers = (agencyId: string) => {
  return useQuery({
    queryKey: ['agency-managers', agencyId],
    queryFn: () => managerService.getAgencyManagers(agencyId),
    enabled: !!agencyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useManagerProfile = (id: string) => {
  return useQuery({
    queryKey: ['manager-profile', id],
    queryFn: () => managerService.getManagerProfile(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCurrentUserManagerProfile = () => {
  return useQuery({
    queryKey: ['current-user-manager-profile'],
    queryFn: () => managerService.getCurrentUserManagerProfile(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateManagerProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateManagerProfileRequest) => managerService.createManagerProfile(data),
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: ['agency-managers', newProfile.agency_id] });
      queryClient.invalidateQueries({ queryKey: ['current-user-manager-profile'] });
      toast.success('Manager profile created successfully!');
    },
    onError: (error) => {
      console.error('Error creating manager profile:', error);
      toast.error('Failed to create manager profile. Please try again.');
    },
  });
};

export const useUpdateManagerProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ManagerProfile> }) =>
      managerService.updateManagerProfile(id, updates),
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ['manager-profile', updatedProfile.id] });
      queryClient.invalidateQueries({ queryKey: ['agency-managers', updatedProfile.agency_id] });
      queryClient.invalidateQueries({ queryKey: ['current-user-manager-profile'] });
      toast.success('Manager profile updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating manager profile:', error);
      toast.error('Failed to update manager profile. Please try again.');
    },
  });
};

// Artist Management hooks
export const useAgencyArtists = (
  agencyId: string,
  filters: ArtistManagementFilters = {},
  pagination: PaginationParams = {}
) => {
  return useQuery({
    queryKey: ['agency-artists', agencyId, filters, pagination],
    queryFn: () => artistManagementService.getAgencyArtists(agencyId, filters, pagination),
    enabled: !!agencyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useArtistManagement = (id: string) => {
  return useQuery({
    queryKey: ['artist-management', id],
    queryFn: () => artistManagementService.getArtistManagement(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateArtistManagement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateArtistManagementRequest) => 
      artistManagementService.createArtistManagement(data),
    onSuccess: (newManagement) => {
      queryClient.invalidateQueries({ queryKey: ['agency-artists', newManagement.agency_id] });
      toast.success('Artist added to agency successfully!');
    },
    onError: (error) => {
      console.error('Error creating artist management:', error);
      toast.error('Failed to add artist to agency. Please try again.');
    },
  });
};

export const useUpdateArtistManagement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ArtistManagement> }) =>
      artistManagementService.updateArtistManagement(id, updates),
    onSuccess: (updatedManagement) => {
      queryClient.invalidateQueries({ queryKey: ['artist-management', updatedManagement.id] });
      queryClient.invalidateQueries({ queryKey: ['agency-artists', updatedManagement.agency_id] });
      toast.success('Artist management updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating artist management:', error);
      toast.error('Failed to update artist management. Please try again.');
    },
  });
};

// Deal Negotiation hooks
export const useDeals = (filters: DealFilters = {}, pagination: PaginationParams = {}) => {
  return useQuery({
    queryKey: ['deals', filters, pagination],
    queryFn: () => dealService.getDeals(filters, pagination),
    staleTime: 2 * 60 * 1000, // 2 minutes for more frequent updates
  });
};

export const useDeal = (id: string) => {
  return useQuery({
    queryKey: ['deal', id],
    queryFn: () => dealService.getDeal(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateDealNegotiationRequest) => dealService.createDeal(data),
    onSuccess: (newDeal) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['agency-dashboard', newDeal.agency_id] });
      toast.success('Deal negotiation created successfully!');
    },
    onError: (error) => {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal negotiation. Please try again.');
    },
  });
};

export const useUpdateDealStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, statusUpdate }: { id: string; statusUpdate: UpdateDealStatusRequest }) =>
      dealService.updateDealStatus(id, statusUpdate),
    onSuccess: (updatedDeal) => {
      queryClient.invalidateQueries({ queryKey: ['deal', updatedDeal.id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['agency-dashboard', updatedDeal.agency_id] });
      toast.success('Deal status updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating deal status:', error);
      toast.error('Failed to update deal status. Please try again.');
    },
  });
};

export const useCalculateNegotiationStrategy = () => {
  return useMutation({
    mutationFn: ({ dealId, marketData }: { dealId: string; marketData?: Record<string, any> }) =>
      dealService.calculateNegotiationStrategy(dealId, marketData),
    onError: (error) => {
      console.error('Error calculating negotiation strategy:', error);
      toast.error('Failed to calculate negotiation strategy. Please try again.');
    },
  });
};

export const useProcessAutomatedResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ dealId, offerAmount, responderId }: { 
      dealId: string; 
      offerAmount: number; 
      responderId: string; 
    }) => dealService.processAutomatedResponse(dealId, offerAmount, responderId),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deal', variables.dealId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal-messages', variables.dealId] });
      toast.success(`Deal ${result.action} automatically!`);
    },
    onError: (error) => {
      console.error('Error processing automated response:', error);
      toast.error('Failed to process automated response. Please try again.');
    },
  });
};

// Deal Messages hooks
export const useDealMessages = (dealId: string) => {
  return useQuery({
    queryKey: ['deal-messages', dealId],
    queryFn: () => dealMessagesService.getDealMessages(dealId),
    enabled: !!dealId,
    staleTime: 1 * 60 * 1000, // 1 minute for frequent updates
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useSendDealMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SendDealMessageRequest) => dealMessagesService.sendMessage(data),
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['deal-messages', newMessage.deal_id] });
      queryClient.invalidateQueries({ queryKey: ['deal', newMessage.deal_id] });
      toast.success('Message sent successfully!');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    },
  });
};

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageId: string) => dealMessagesService.markMessageAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-messages'] });
    },
    onError: (error) => {
      console.error('Error marking message as read:', error);
    },
  });
};

// Analytics hooks
export const useAgencyAnalytics = (
  agencyId: string,
  periodStart?: string,
  periodEnd?: string
) => {
  return useQuery({
    queryKey: ['agency-analytics', agencyId, periodStart, periodEnd],
    queryFn: () => analyticsService.getAgencyAnalytics(agencyId, periodStart, periodEnd),
    enabled: !!agencyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateAgencyAnalytics = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ agencyId, periodStart, periodEnd }: {
      agencyId: string;
      periodStart?: string;
      periodEnd?: string;
    }) => analyticsService.updateAgencyAnalytics(agencyId, periodStart, periodEnd),
    onSuccess: (analytics) => {
      queryClient.invalidateQueries({ 
        queryKey: ['agency-analytics', analytics.agency_id] 
      });
      toast.success('Analytics updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating analytics:', error);
      toast.error('Failed to update analytics. Please try again.');
    },
  });
};

export const useAgencyDashboard = (agencyId: string, managerId?: string) => {
  return useQuery({
    queryKey: ['agency-dashboard', agencyId, managerId],
    queryFn: () => analyticsService.getDashboardData(agencyId, managerId),
    enabled: !!agencyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Utility hooks
export const useAgencyPermissions = (agencyId?: string) => {
  const { data: managerProfile } = useCurrentUserManagerProfile();
  
  const hasPermission = (requiredRole: 'manager' | 'senior_manager' | 'primary_manager' = 'manager') => {
    if (!managerProfile || !agencyId || managerProfile.agency_id !== agencyId) {
      return false;
    }
    
    const roleHierarchy = {
      'assistant_manager': 1,
      'co_manager': 2,
      'primary_manager': 3,
      'agency_owner': 4
    };
    
    const requiredLevels = {
      'manager': 1,
      'senior_manager': 2,
      'primary_manager': 3
    };
    
    const userLevel = roleHierarchy[managerProfile.role] || 0;
    const requiredLevel = requiredLevels[requiredRole] || 1;
    
    return userLevel >= requiredLevel;
  };
  
  return {
    managerProfile,
    hasPermission,
    isManager: hasPermission('manager'),
    isSeniorManager: hasPermission('senior_manager'),
    isPrimaryManager: hasPermission('primary_manager'),
    isAgencyOwner: managerProfile?.role === 'agency_owner'
  };
};