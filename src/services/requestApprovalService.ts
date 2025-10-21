import { supabase } from '@/integrations/supabase/client';

export type RequestType = 'organization_join' | 'manager_client';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface OrganizationJoinRequest {
  id: string;
  organization_id: string;
  requester_id: string;
  requested_role: 'member' | 'admin' | 'manager';
  message: string | null;
  status: RequestStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  // Joined data
  requester?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    display_name?: string;
  };
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface ManagerClientRequest {
  id: string;
  manager_id: string;
  client_id: string;
  client_type: 'comedian' | 'organization';
  manager_types: string[];
  message: string | null;
  status: RequestStatus;
  created_at: string;
  reviewed_at: string | null;
  // Joined data
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    display_name?: string;
  };
  client?: {
    id: string;
    name: string;
    type?: string;
  };
}

/**
 * Fetch pending organization join requests for organizations the user administers
 */
export async function getPendingOrganizationRequests(
  userId: string
): Promise<OrganizationJoinRequest[]> {
  // First get organizations where user is admin
  const { data: adminOrgs, error: adminError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('role', 'admin');

  if (adminError) throw adminError;
  if (!adminOrgs || adminOrgs.length === 0) return [];

  const orgIds = adminOrgs.map((org) => org.organization_id);

  // Get pending requests for these organizations
  const { data, error } = await supabase
    .from('organization_join_requests')
    .select(`
      id,
      organization_id,
      requester_id,
      requested_role,
      message,
      status,
      created_at,
      reviewed_at,
      reviewed_by,
      requester:profiles!organization_join_requests_requester_id_fkey(
        id,
        first_name,
        last_name,
        email,
        display_name
      ),
      organization:organizations!organization_join_requests_organization_id_fkey(
        id,
        name,
        type
      )
    `)
    .in('organization_id', orgIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as OrganizationJoinRequest[];
}

/**
 * Fetch pending manager requests for the current user (as a comedian or organization)
 */
export async function getPendingManagerRequests(
  userId: string
): Promise<ManagerClientRequest[]> {
  // Get requests where user is the client (comedian)
  const { data: comedianRequests, error: comedianError } = await supabase
    .from('manager_client_requests')
    .select(`
      id,
      manager_id,
      client_id,
      client_type,
      manager_types,
      message,
      status,
      created_at,
      reviewed_at,
      manager:profiles!manager_client_requests_manager_id_fkey(
        id,
        first_name,
        last_name,
        email,
        display_name
      )
    `)
    .eq('client_id', userId)
    .eq('client_type', 'comedian')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (comedianError) throw comedianError;

  // Get organizations where user is admin/manager
  const { data: userOrgs, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .in('role', ['admin', 'manager']);

  let organizationRequests: any[] = [];
  if (!orgError && userOrgs && userOrgs.length > 0) {
    const orgIds = userOrgs.map((org) => org.organization_id);

    const { data: orgReqs, error: orgReqError } = await supabase
      .from('manager_client_requests')
      .select(`
        id,
        manager_id,
        client_id,
        client_type,
        manager_types,
        message,
        status,
        created_at,
        reviewed_at,
        manager:profiles!manager_client_requests_manager_id_fkey(
          id,
          first_name,
          last_name,
          email,
          display_name
        ),
        client:organizations!manager_client_requests_client_id_fkey(
          id,
          name,
          type
        )
      `)
      .in('client_id', orgIds)
      .eq('client_type', 'organization')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!orgReqError && orgReqs) {
      organizationRequests = orgReqs;
    }
  }

  // Combine and transform comedian requests
  const allRequests = [
    ...(comedianRequests || []).map((req) => ({
      ...req,
      client: {
        id: userId,
        name: 'You (as comedian)',
      },
    })),
    ...organizationRequests,
  ];

  return allRequests as ManagerClientRequest[];
}

/**
 * Approve an organization join request and add user as member
 */
export async function approveOrganizationRequest(
  requestId: string,
  reviewerId: string
): Promise<void> {
  // Get the request details
  const { data: request, error: fetchError } = await supabase
    .from('organization_join_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;
  if (!request) throw new Error('Request not found');

  // Update request status
  const { error: updateError } = await supabase
    .from('organization_join_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq('id', requestId);

  if (updateError) throw updateError;

  // Add user as organization member with requested role
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: request.organization_id,
      user_id: request.requester_id,
      role: request.requested_role,
    });

  if (memberError) throw memberError;
}

/**
 * Reject an organization join request
 */
export async function rejectOrganizationRequest(
  requestId: string,
  reviewerId: string
): Promise<void> {
  const { error } = await supabase
    .from('organization_join_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Approve a manager client request and create manager-client relationship
 */
export async function approveManagerRequest(
  requestId: string,
  clientId: string
): Promise<void> {
  // Get the request details
  const { data: request, error: fetchError } = await supabase
    .from('manager_client_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;
  if (!request) throw new Error('Request not found');

  // Update request status
  const { error: updateError } = await supabase
    .from('manager_client_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw updateError;

  // Create manager-client relationship
  const { error: relationError } = await supabase
    .from('manager_client_relationships')
    .insert({
      manager_id: request.manager_id,
      client_id: request.client_id,
      client_type: request.client_type,
      manager_types: request.manager_types,
      status: 'active',
    });

  if (relationError) throw relationError;
}

/**
 * Reject a manager client request
 */
export async function rejectManagerRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from('manager_client_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
}

/**
 * Get total count of pending requests for a user (across all types)
 */
export async function getPendingRequestCount(userId: string): Promise<number> {
  const [orgRequests, managerRequests] = await Promise.all([
    getPendingOrganizationRequests(userId),
    getPendingManagerRequests(userId),
  ]);

  return orgRequests.length + managerRequests.length;
}
