import { supabase } from '@/integrations/supabase/client';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string | null;
  status: 'requested' | 'planned' | 'in_progress' | 'completed';
  category: string | null;
  priority: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  vote_count?: number;
  user_has_voted?: boolean;
  comment_count?: number;
  creator_name?: string;
  creator_avatar?: string;
}

export interface FeatureVote {
  id: string;
  feature_id: string;
  user_id: string;
  created_at: string;
}

export interface FeatureComment {
  id: string;
  feature_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

/**
 * Get all features, optionally filtered by status
 */
export async function listFeatures(status?: string): Promise<FeatureRequest[]> {
  try {
    let query = supabase
      .from('feature_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get user's votes in a single query to avoid N+1 problem
    const { data: user } = await supabase.auth.getUser();
    let votedFeatureIds = new Set<string>();

    if (user.user) {
      const { data: votes } = await supabase
        .from('feature_votes')
        .select('feature_id')
        .eq('user_id', user.user.id);

      votedFeatureIds = new Set(votes?.map(v => v.feature_id) || []);
    }

    // Get all creator profiles in a single query
    const creatorIds = [...new Set(data?.map(f => f.created_by) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', creatorIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Transform data to include computed fields
    return (data || []).map((feature: any) => {
      const profile = profileMap.get(feature.created_by);
      return {
        id: feature.id,
        title: feature.title,
        description: feature.description,
        status: feature.status,
        category: feature.category,
        priority: feature.priority,
        created_by: feature.created_by,
        created_at: feature.created_at,
        updated_at: feature.updated_at,
        completed_at: feature.completed_at,
        vote_count: feature.vote_count || 0,
        comment_count: feature.comment_count || 0,
        user_has_voted: votedFeatureIds.has(feature.id),
        creator_name: profile?.name || 'Unknown',
        creator_avatar: profile?.avatar_url || null
      };
    });
  } catch (error) {
    console.error('Error listing features:', error);
    throw error;
  }
}

/**
 * Get single feature with votes and comments
 */
export async function getFeature(id: string): Promise<FeatureRequest> {
  try {
    const { data, error } = await supabase
      .from('feature_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Get creator profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', data.created_by)
      .single();

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      category: data.category,
      priority: data.priority,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      completed_at: data.completed_at,
      vote_count: data.vote_count || 0,
      comment_count: data.comment_count || 0,
      creator_name: profile?.name || 'Unknown',
      creator_avatar: profile?.avatar_url || null
    };
  } catch (error) {
    console.error('Error getting feature:', error);
    throw error;
  }
}

/**
 * Create new feature request
 */
export async function createFeature(data: {
  title: string;
  description?: string;
  category?: string;
}): Promise<FeatureRequest> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data: feature, error } = await supabase
      .from('feature_requests')
      .insert({
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        created_by: user.user.id,
        status: 'requested'
      })
      .select()
      .single();

    if (error) throw error;

    return feature as FeatureRequest;
  } catch (error) {
    console.error('Error creating feature:', error);
    throw error;
  }
}

/**
 * Update feature (admin only)
 */
export async function updateFeature(
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: string;
    category?: string;
    priority?: number;
  }
): Promise<FeatureRequest> {
  try {
    const { data: feature, error } = await supabase
      .from('feature_requests')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return feature as FeatureRequest;
  } catch (error) {
    console.error('Error updating feature:', error);
    throw error;
  }
}

/**
 * Delete feature (admin only)
 */
export async function deleteFeature(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('feature_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting feature:', error);
    throw error;
  }
}

/**
 * Check if user has voted for a feature
 */
export async function checkUserVote(featureId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase
      .from('feature_votes')
      .select('id')
      .eq('feature_id', featureId)
      .eq('user_id', user.user.id)
      .maybeSingle();

    if (error) throw error;

    return !!data;
  } catch (error) {
    console.error('Error checking user vote:', error);
    return false;
  }
}

/**
 * Upvote a feature
 */
export async function voteFeature(featureId: string): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('feature_votes')
      .insert({
        feature_id: featureId,
        user_id: user.user.id
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error voting feature:', error);
    throw error;
  }
}

/**
 * Remove upvote
 */
export async function unvoteFeature(featureId: string): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('feature_votes')
      .delete()
      .eq('feature_id', featureId)
      .eq('user_id', user.user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Error unvoting feature:', error);
    throw error;
  }
}

/**
 * Get comments for a feature
 */
export async function getFeatureComments(featureId: string): Promise<FeatureComment[]> {
  try {
    const { data, error } = await supabase
      .from('feature_comments')
      .select('*')
      .eq('feature_id', featureId)
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
        id: comment.id,
        feature_id: comment.feature_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user_name: profile?.name || 'Unknown',
        user_avatar: profile?.avatar_url || null
      };
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
}

/**
 * Add comment
 */
export async function addComment(featureId: string, content: string): Promise<FeatureComment> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data: comment, error } = await supabase
      .from('feature_comments')
      .insert({
        feature_id: featureId,
        user_id: user.user.id,
        content
      })
      .select()
      .single();

    if (error) throw error;

    return comment as FeatureComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

/**
 * Update comment
 */
export async function updateComment(id: string, content: string): Promise<FeatureComment> {
  try {
    const { data: comment, error } = await supabase
      .from('feature_comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return comment as FeatureComment;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

/**
 * Delete comment
 */
export async function deleteComment(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('feature_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}
