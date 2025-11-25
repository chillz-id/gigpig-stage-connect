import { supabase } from '@/integrations/supabase/client';

export interface BugReport {
  id: string;
  title: string;
  description: string;
  steps_to_reproduce: string | null;
  expected_behavior: string | null;
  actual_behavior: string | null;
  status: 'requested' | 'planned' | 'in_progress' | 'completed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'ui' | 'functionality' | 'performance' | 'security' | 'data' | null;
  reported_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  comment_count?: number;
  reporter_name?: string;
  reporter_avatar?: string;
  assigned_name?: string;
  assigned_avatar?: string;
}

export interface BugComment {
  id: string;
  bug_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

/**
 * Get all bugs, optionally filtered by status
 */
export async function listBugs(status?: string): Promise<BugReport[]> {
  try {
    let query = supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get all reporter and assignee profiles in separate queries
    const reporterIds = [...new Set(data?.map(b => b.reported_by) || [])];
    const assigneeIds = [...new Set(data?.filter(b => b.assigned_to).map(b => b.assigned_to) || [])];
    const allUserIds = [...new Set([...reporterIds, ...assigneeIds])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', allUserIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Transform data to match interface
    return (data || []).map((bug: any) => {
      const reporter = profileMap.get(bug.reported_by);
      const assignee = bug.assigned_to ? profileMap.get(bug.assigned_to) : null;
      return {
        ...bug,
        comment_count: bug.comment_count || 0,
        reporter_name: reporter?.name || 'Unknown',
        reporter_avatar: reporter?.avatar_url || null,
        assigned_name: assignee?.name || null,
        assigned_avatar: assignee?.avatar_url || null,
      };
    });
  } catch (error) {
    console.error('Error fetching bugs:', error);
    throw error;
  }
}

/**
 * Get a single bug by ID
 */
export async function getBug(bugId: string): Promise<BugReport | null> {
  try {
    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .eq('id', bugId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Get reporter and assignee profiles
    const userIds = [data.reported_by];
    if (data.assigned_to) userIds.push(data.assigned_to);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const reporter = profileMap.get(data.reported_by);
    const assignee = data.assigned_to ? profileMap.get(data.assigned_to) : null;

    return {
      ...data,
      comment_count: data.comment_count || 0,
      reporter_name: reporter?.name || 'Unknown',
      reporter_avatar: reporter?.avatar_url || null,
      assigned_name: assignee?.name || null,
      assigned_avatar: assignee?.avatar_url || null,
    };
  } catch (error) {
    console.error('Error fetching bug:', error);
    throw error;
  }
}

/**
 * Create a new bug report
 */
export async function createBug(bug: {
  title: string;
  description: string;
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'ui' | 'functionality' | 'performance' | 'security' | 'data';
}): Promise<BugReport> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('bug_reports')
      .insert({
        ...bug,
        reported_by: user.id,
        severity: bug.severity || 'medium',
      })
      .select('*')
      .single();

    if (error) throw error;

    // Get reporter profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', user.id)
      .single();

    return {
      ...data,
      comment_count: data.comment_count || 0,
      reporter_name: profile?.name || 'Unknown',
      reporter_avatar: profile?.avatar_url || null,
      assigned_name: null,
      assigned_avatar: null,
    };
  } catch (error) {
    console.error('Error creating bug:', error);
    throw error;
  }
}

/**
 * Update a bug report (admin only)
 */
export async function updateBug(
  bugId: string,
  updates: {
    status?: string;
    severity?: string;
    category?: string;
    assigned_to?: string;
  }
): Promise<BugReport> {
  try {
    // Set timestamps based on status changes
    const timestampUpdates: any = {};
    if (updates.status === 'fixed') {
      timestampUpdates.fixed_at = new Date().toISOString();
    } else if (updates.status === 'verified') {
      timestampUpdates.verified_at = new Date().toISOString();
    } else if (updates.status === 'closed') {
      timestampUpdates.closed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('bug_reports')
      .update({
        ...updates,
        ...timestampUpdates,
      })
      .eq('id', bugId)
      .select('*')
      .single();

    if (error) throw error;

    // Get reporter and assignee profiles
    const userIds = [data.reported_by];
    if (data.assigned_to) userIds.push(data.assigned_to);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const reporter = profileMap.get(data.reported_by);
    const assignee = data.assigned_to ? profileMap.get(data.assigned_to) : null;

    return {
      ...data,
      comment_count: data.comment_count || 0,
      reporter_name: reporter?.name || 'Unknown',
      reporter_avatar: reporter?.avatar_url || null,
      assigned_name: assignee?.name || null,
      assigned_avatar: assignee?.avatar_url || null,
    };
  } catch (error) {
    console.error('Error updating bug:', error);
    throw error;
  }
}

/**
 * Delete a bug report (admin only)
 */
export async function deleteBug(bugId: string): Promise<void> {
  try {
    const { error } = await supabase.from('bug_reports').delete().eq('id', bugId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting bug:', error);
    throw error;
  }
}

/**
 * Get comments for a bug
 */
export async function listBugComments(bugId: string): Promise<BugComment[]> {
  try {
    const { data, error } = await supabase
      .from('bug_comments')
      .select('*')
      .eq('bug_id', bugId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get all commenter profiles in a single query
    const userIds = [...new Set(data?.map(c => c.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return (data || []).map((comment: any) => {
      const profile = profileMap.get(comment.user_id);
      return {
        ...comment,
        user_name: profile?.name || 'Unknown',
        user_avatar: profile?.avatar_url || null,
      };
    });
  } catch (error) {
    console.error('Error fetching bug comments:', error);
    throw error;
  }
}

/**
 * Add a comment to a bug
 */
export async function addBugComment(bugId: string, content: string): Promise<BugComment> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('bug_comments')
      .insert({
        bug_id: bugId,
        user_id: user.id,
        content,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', user.id)
      .single();

    return {
      ...data,
      user_name: profile?.name || 'Unknown',
      user_avatar: profile?.avatar_url || null,
    };
  } catch (error) {
    console.error('Error adding bug comment:', error);
    throw error;
  }
}

/**
 * Update a comment (user can only update their own)
 */
export async function updateBugComment(commentId: string, content: string): Promise<BugComment> {
  try {
    const { data, error } = await supabase
      .from('bug_comments')
      .update({ content })
      .eq('id', commentId)
      .select('*')
      .single();

    if (error) throw error;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', data.user_id)
      .single();

    return {
      ...data,
      user_name: profile?.name || 'Unknown',
      user_avatar: profile?.avatar_url || null,
    };
  } catch (error) {
    console.error('Error updating bug comment:', error);
    throw error;
  }
}

/**
 * Delete a comment (user can only delete their own)
 */
export async function deleteBugComment(commentId: string): Promise<void> {
  try {
    const { error } = await supabase.from('bug_comments').delete().eq('id', commentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting bug comment:', error);
    throw error;
  }
}
