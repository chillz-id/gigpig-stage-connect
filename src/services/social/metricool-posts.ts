/**
 * Metricool Posts Service
 *
 * CRUD operations for scheduled posts via the Metricool API.
 * Uses metricool-client.ts for all API communication.
 */

import { metricoolClient } from './metricool-client';
import type {
  ScheduledPost,
  BestTimes,
  BestTimesProvider,
  MetricoolApiResponse,
  MetricoolListResponse,
  ScheduledPostApprovalData,
} from '@/types/social';

// ─── Posts CRUD ──────────────────────────────────────────────────────────────

/**
 * Create a new scheduled post.
 */
export async function createPost(
  post: ScheduledPost,
): Promise<MetricoolApiResponse<ScheduledPost>> {
  return metricoolClient.post('/v2/scheduler/posts', post);
}

/**
 * Get scheduled posts between two dates.
 */
export async function getPosts(
  start: string,
  end: string,
  timezone = 'Australia/Sydney',
): Promise<MetricoolListResponse<ScheduledPost>> {
  return metricoolClient.get('/v2/scheduler/posts', {
    start,
    end,
    timezone,
  });
}

/**
 * Get a single scheduled post by ID.
 */
export async function getPost(
  id: number,
): Promise<MetricoolApiResponse<ScheduledPost>> {
  return metricoolClient.get(`/v2/scheduler/posts/${id}`);
}

/**
 * Update an existing scheduled post (full replace).
 */
export async function updatePost(
  id: number,
  post: ScheduledPost,
): Promise<MetricoolApiResponse<ScheduledPost>> {
  return metricoolClient.put(`/v2/scheduler/posts/${id}`, post);
}

/**
 * Partially update a scheduled post.
 */
export async function patchPost(
  id: number,
  fields: string[],
  post: Partial<ScheduledPost>,
): Promise<MetricoolApiResponse<boolean>> {
  return metricoolClient.patch(`/v2/scheduler/posts/${id}`, post, {
    fields: fields.join(','),
  });
}

/**
 * Delete a scheduled post by ID.
 * If the post is a thread parent, all thread posts are deleted.
 */
export async function deletePost(
  id: number,
): Promise<MetricoolApiResponse<boolean>> {
  return metricoolClient.delete(`/v2/scheduler/posts/${id}`);
}

// ─── Approval Workflow ───────────────────────────────────────────────────────

/**
 * Send multiple posts to review in bulk.
 */
export async function sendPostsToReview(
  approvalData: ScheduledPostApprovalData,
): Promise<unknown> {
  return metricoolClient.put('/v2/scheduler/posts', approvalData);
}

/**
 * Approve or reject a scheduled post.
 */
export async function updatePostApproval(
  id: number,
  approval: { uuid: string; status: 'APPROVED' | 'REJECTED'; reviewerMail?: string },
): Promise<MetricoolApiResponse<boolean>> {
  return metricoolClient.put(`/v2/scheduler/posts/${id}/approvals`, approval);
}

/**
 * Get the brand configuration for post approval workflow.
 */
export async function getApprovalConfig(): Promise<unknown> {
  return metricoolClient.get('/v2/scheduler/posts/approvals-config');
}

// ─── Best Times ──────────────────────────────────────────────────────────────

/**
 * Get optimal posting times for a specific platform.
 */
export async function getBestTimes(
  provider: BestTimesProvider,
  start?: string,
  end?: string,
  timezone = 'Australia/Sydney',
): Promise<MetricoolListResponse<BestTimes>> {
  const params: Record<string, string> = { timezone };
  if (start) params.start = start;
  if (end) params.end = end;
  return metricoolClient.get(`/v2/scheduler/besttimes/${provider}`, params);
}

// ─── Instagram Properties ────────────────────────────────────────────────────

/**
 * Get Instagram auto-publish properties for the brand.
 */
export async function getInstagramProperties(): Promise<unknown> {
  return metricoolClient.get('/v2/scheduler/posts/instagram-properties');
}

// ─── Library Posts ───────────────────────────────────────────────────────────

/**
 * Get all library posts for the brand.
 */
export async function getLibraryPosts(): Promise<unknown> {
  return metricoolClient.get('/v2/scheduler/library-posts');
}

/**
 * Create a new library post.
 */
export async function createLibraryPost(
  post: ScheduledPost,
): Promise<unknown> {
  return metricoolClient.post('/v2/scheduler/library-posts', post);
}

/**
 * Get a library post by ID.
 */
export async function getLibraryPost(id: number): Promise<unknown> {
  return metricoolClient.get(`/v2/scheduler/library-posts/${id}`);
}

/**
 * Delete a library post.
 */
export async function deleteLibraryPost(id: number): Promise<unknown> {
  return metricoolClient.delete(`/v2/scheduler/library-posts/${id}`);
}

// ─── Brands ──────────────────────────────────────────────────────────────────

/**
 * Get list of brands (profiles) for the account.
 */
export async function getBrands(): Promise<unknown> {
  return metricoolClient.get('/admin/simpleProfiles');
}
