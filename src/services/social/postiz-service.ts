/**
 * Postiz Service - API wrapper for Postiz social media scheduling
 * Hybrid Integration: Custom UI + Postiz REST API
 *
 * Architecture:
 * - Uses Postiz REST API directly (browser-compatible)
 * - Syncs data with local Supabase database
 * - Supports 10+ social platforms (Instagram, Twitter, Facebook, etc.)
 *
 * Note: @postiz/node SDK is Node.js only and cannot run in browser.
 * We use direct fetch calls to the Postiz REST API instead.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Types for Postiz API responses
export interface PostizChannel {
  id: string;
  platform: string;
  name: string;
  username?: string;
  isActive: boolean;
  lastSync?: string;
}

export interface PostizPost {
  id: string;
  channelId: string;
  content: string;
  mediaUrls?: string[];
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'posting' | 'posted' | 'failed' | 'cancelled';
  postedAt?: string;
  errorMessage?: string;
}

export interface PostizAnalytics {
  postId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  platformMetrics?: Record<string, unknown>;
}

export interface SchedulePostParams {
  channelId: string;
  content: string;
  mediaFileIds?: string[];
  hashtags?: string[];
  scheduledAt: string;
  eventId?: string;
}

export interface ConnectChannelParams {
  platform: string;
  oauthCode: string;
}

/**
 * Postiz Service Class
 * Manages all social media scheduling operations via Postiz API
 */
export class PostizService {
  private supabase;
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    // Initialize Supabase client
    this.supabase = createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    // Postiz API configuration
    this.apiKey = import.meta.env.VITE_POSTIZ_API_KEY || '';
    this.apiUrl = import.meta.env.VITE_POSTIZ_API_URL || 'https://api.postiz.com/public/v1';

    // Use custom instance URL if provided
    const instanceUrl = import.meta.env.VITE_POSTIZ_INSTANCE_URL;
    if (instanceUrl) {
      this.apiUrl = `${instanceUrl}/public/v1`;
    }

    if (!this.apiKey) {
      console.warn('VITE_POSTIZ_API_KEY not configured. Social media scheduling will be limited.');
    }
  }

  /**
   * Check if Postiz API is configured and available
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Make authenticated request to Postiz API
   */
  private async fetchPostiz(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Postiz API key not configured');
    }

    const url = `${this.apiUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Postiz API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Connect a new social media channel
   * @param userId - User's UUID
   * @param params - Channel connection parameters
   */
  async connectChannel(userId: string, params: ConnectChannelParams): Promise<PostizChannel> {
    try {
      // TODO: Implement Postiz OAuth flow
      // For now, return mock data structure
      const channel: PostizChannel = {
        id: `postiz_${Date.now()}`,
        platform: params.platform,
        name: `${params.platform} Account`,
        username: '@mockuser',
        isActive: true,
        lastSync: new Date().toISOString(),
      };

      // Save to local database
      const { data, error } = await this.supabase
        .from('social_channels')
        .insert({
          user_id: userId,
          platform: params.platform,
          channel_name: channel.name,
          channel_handle: channel.username,
          postiz_integration_id: channel.id,
          is_active: true,
          oauth_data: {}, // Would contain encrypted OAuth tokens
          last_sync_at: channel.lastSync,
        })
        .select()
        .single();

      if (error) throw error;

      return channel;
    } catch (error) {
      console.error('Failed to connect channel:', error);
      throw new Error('Failed to connect social media channel');
    }
  }

  /**
   * Get user's connected channels
   * Fetches from Postiz API and syncs with local database
   * @param userId - User's UUID
   */
  async getUserChannels(userId: string): Promise<PostizChannel[]> {
    try {
      // If Postiz is configured, fetch fresh data from API
      if (this.isConfigured()) {
        try {
          const integrations = await this.fetchPostiz('/integrations');

          // Sync integrations with local database
          for (const integration of integrations) {
            await this.supabase
              .from('social_channels')
              .upsert({
                user_id: userId,
                platform: integration.provider || integration.type,
                channel_name: integration.name,
                channel_handle: integration.username || integration.handle,
                postiz_integration_id: integration.id,
                is_active: true,
                last_sync_at: new Date().toISOString(),
              }, {
                onConflict: 'postiz_integration_id',
              });
          }
        } catch (apiError) {
          console.warn('Postiz API fetch failed, using cached data:', apiError);
        }
      }

      // Return from local database (either fresh-synced or cached)
      const { data, error } = await this.supabase
        .from('social_channels')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('platform', { ascending: true });

      if (error) throw error;

      return (data || []).map(channel => ({
        id: channel.postiz_integration_id,
        platform: channel.platform,
        name: channel.channel_name,
        username: channel.channel_handle || undefined,
        isActive: channel.is_active,
        lastSync: channel.last_sync_at || undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      return [];
    }
  }

  /**
   * Schedule a new social media post
   * @param userId - User's UUID
   * @param params - Post scheduling parameters
   */
  async schedulePost(userId: string, params: SchedulePostParams): Promise<PostizPost> {
    try {
      // Get media URLs from media_file_ids
      let mediaUrls: string[] = [];
      let mediaObjects: any[] = [];

      if (params.mediaFileIds && params.mediaFileIds.length > 0) {
        const { data: mediaFiles } = await this.supabase
          .from('media_files')
          .select('public_url, file_name')
          .in('id', params.mediaFileIds);

        mediaUrls = (mediaFiles || [])
          .map(f => f.public_url)
          .filter((url): url is string => url !== null);

        // Prepare media objects for Postiz API
        mediaObjects = mediaUrls.map((url, index) => ({
          id: `media_${Date.now()}_${index}`,
          path: url,
          alt: mediaFiles?.[index]?.file_name || '',
        }));
      }

      // Prepare content with hashtags
      let fullContent = params.content;
      if (params.hashtags && params.hashtags.length > 0) {
        const hashtagsString = params.hashtags.map(tag => `#${tag}`).join(' ');
        fullContent = `${params.content}\n\n${hashtagsString}`;
      }

      let postizPostId: string | undefined;

      // Call Postiz API if configured
      if (this.isConfigured()) {
        try {
          const postizPayload = {
            type: 'schedule' as const,
            date: params.scheduledAt,
            shortLink: false,
            tags: [],
            posts: [{
              integration: { id: params.channelId },
              value: [{
                content: fullContent,
                id: `content_${Date.now()}`,
                image: mediaObjects,
              }],
              group: `group_${Date.now()}`,
              settings: {} as any, // Platform-specific settings
            }],
          };

          const response = await this.fetchPostiz('/posts', {
            method: 'POST',
            body: JSON.stringify(postizPayload),
          });
          postizPostId = response?.id || response?.post?.id;
        } catch (apiError) {
          console.error('Postiz API error:', apiError);
          // Continue with local storage even if API fails
        }
      }

      // Save to local database (with or without Postiz post ID)
      const { data, error } = await this.supabase
        .from('social_posts')
        .insert({
          user_id: userId,
          channel_id: params.channelId,
          content: params.content,
          media_urls: mediaUrls,
          media_file_ids: params.mediaFileIds,
          hashtags: params.hashtags,
          scheduled_at: params.scheduledAt,
          postiz_post_id: postizPostId || `local_${Date.now()}`,
          status: postizPostId ? 'scheduled' : 'draft',
          event_id: params.eventId,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        channelId: data.channel_id,
        content: data.content,
        mediaUrls: data.media_urls || undefined,
        scheduledAt: data.scheduled_at,
        status: data.status as PostizPost['status'],
        postedAt: data.posted_at || undefined,
        errorMessage: data.error_message || undefined,
      };
    } catch (error) {
      console.error('Failed to schedule post:', error);
      throw new Error('Failed to schedule social media post');
    }
  }

  /**
   * Get scheduled and posted content for a user
   * @param userId - User's UUID
   */
  async getUserPosts(userId: string): Promise<PostizPost[]> {
    try {
      const { data, error } = await this.supabase
        .from('social_posts')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(post => ({
        id: post.id,
        channelId: post.channel_id,
        content: post.content,
        mediaUrls: post.media_urls || undefined,
        scheduledAt: post.scheduled_at,
        status: post.status as PostizPost['status'],
        postedAt: post.posted_at || undefined,
        errorMessage: post.error_message || undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      return [];
    }
  }

  /**
   * Get upcoming scheduled posts
   * @param userId - User's UUID
   * @param limit - Maximum number of posts to return
   */
  async getUpcomingPosts(userId: string, limit = 10): Promise<PostizPost[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_upcoming_posts', {
          p_user_id: userId,
          p_limit: limit,
        });

      if (error) throw error;

      return (data || []).map(post => ({
        id: post.id,
        channelId: '', // Not returned by helper function
        content: post.content,
        scheduledAt: post.scheduled_at,
        status: post.status as PostizPost['status'],
      }));
    } catch (error) {
      console.error('Failed to fetch upcoming posts:', error);
      return [];
    }
  }

  /**
   * Update a scheduled post
   * @param userId - User's UUID
   * @param postId - Post UUID
   * @param updates - Fields to update
   */
  async updatePost(
    userId: string,
    postId: string,
    updates: Partial<SchedulePostParams>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('social_posts')
        .update({
          content: updates.content,
          hashtags: updates.hashtags,
          scheduled_at: updates.scheduledAt,
        })
        .eq('id', postId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update post:', error);
      throw new Error('Failed to update post');
    }
  }

  /**
   * Cancel a scheduled post
   * Deletes from Postiz API and marks as cancelled in local database
   * @param userId - User's UUID
   * @param postId - Post UUID
   */
  async cancelPost(userId: string, postId: string): Promise<void> {
    try {
      // Get the post to find Postiz post ID
      const { data: post } = await this.supabase
        .from('social_posts')
        .select('postiz_post_id')
        .eq('id', postId)
        .eq('user_id', userId)
        .single();

      // Delete from Postiz API if configured and has valid ID
      if (this.isConfigured() && post?.postiz_post_id && !post.postiz_post_id.startsWith('local_')) {
        try {
          await this.fetchPostiz(`/posts/${post.postiz_post_id}`, {
            method: 'DELETE',
          });
        } catch (apiError) {
          console.warn('Postiz API delete failed:', apiError);
          // Continue with local cancellation even if API fails
        }
      }

      // Update local database
      const { error } = await this.supabase
        .from('social_posts')
        .update({ status: 'cancelled' })
        .eq('id', postId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to cancel post:', error);
      throw new Error('Failed to cancel post');
    }
  }

  /**
   * Get analytics for a post
   * @param userId - User's UUID
   * @param postId - Post UUID
   */
  async getPostAnalytics(userId: string, postId: string): Promise<PostizAnalytics | null> {
    try {
      const { data, error } = await this.supabase
        .from('social_post_analytics')
        .select('*')
        .eq('post_id', postId)
        .single();

      if (error || !data) return null;

      return {
        postId: data.post_id,
        views: data.views,
        likes: data.likes,
        comments: data.comments,
        shares: data.shares,
        platformMetrics: (data.platform_metrics as Record<string, unknown>) || undefined,
      };
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return null;
    }
  }

  /**
   * Get user's overall social media analytics
   * @param userId - User's UUID
   */
  async getUserAnalytics(userId: string) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_social_analytics', {
          p_user_id: userId,
        });

      if (error) throw error;

      return data?.[0] || {
        total_posts: 0,
        total_views: 0,
        total_likes: 0,
        total_comments: 0,
        total_shares: 0,
        avg_engagement: 0,
      };
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
      return null;
    }
  }

  /**
   * Get post templates for a user
   * @param userId - User's UUID
   */
  async getTemplates(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('social_post_templates')
        .select('*')
        .eq('user_id', userId)
        .order('template_type', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      return [];
    }
  }

  /**
   * Apply template with variable substitution
   * @param template - Template content with {{variables}}
   * @param variables - Variable values to substitute
   */
  applyTemplate(template: string, variables: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Disconnect a social media channel
   * @param userId - User's UUID
   * @param channelId - Channel UUID
   */
  async disconnectChannel(userId: string, channelId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('social_channels')
        .update({ is_active: false })
        .eq('id', channelId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to disconnect channel:', error);
      throw new Error('Failed to disconnect channel');
    }
  }

  /**
   * Upload media file to Postiz
   * @param file - File buffer
   * @param extension - File extension (e.g., 'jpg', 'png', 'mp4')
   */
  async uploadMedia(file: Buffer, extension: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Postiz API not configured. Cannot upload media.');
    }

    try {
      // Convert buffer to base64 for JSON transport
      const base64Data = file.toString('base64');

      const response = await this.fetchPostiz('/upload', {
        method: 'POST',
        body: JSON.stringify({
          file: base64Data,
          extension: extension,
        }),
      });

      return response?.url || response?.path;
    } catch (error) {
      console.error('Failed to upload media to Postiz:', error);
      throw new Error('Failed to upload media');
    }
  }

  /**
   * Get list of scheduled posts from Postiz API
   * @param startDate - Start date in ISO format
   * @param endDate - End date in ISO format
   */
  async getPostizScheduledPosts(startDate: string, endDate: string): Promise<any[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await this.fetchPostiz(`/posts?${params.toString()}`);

      return response?.posts || response || [];
    } catch (error) {
      console.error('Failed to fetch Postiz scheduled posts:', error);
      return [];
    }
  }
}

// Export singleton instance
export const postizService = new PostizService();
