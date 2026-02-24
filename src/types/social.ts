/**
 * Metricool API TypeScript Types
 * Extracted from Metricool swagger.json (v2.0.0)
 * Base URL: https://app.metricool.com/api
 */

// ─── Core Types ──────────────────────────────────────────────────────────────

export interface DateTimeInfo {
  dateTime: string; // ISO format: "2025-12-25T00:00:00"
  timezone: string; // e.g., "Australia/Sydney"
}

export type ProviderStatusValue =
  | 'PUBLISHED'
  | 'PUBLISHING'
  | 'PENDING'
  | 'ERROR'
  | 'DRAFT';

export interface ProviderStatus {
  network: string;
  id?: string;
  status?: ProviderStatusValue;
  publicUrl?: string;
  detailedStatus?: string;
}

// ─── Platform-Specific Data ──────────────────────────────────────────────────

export interface ScheduledPostImageTag {
  username: string;
  x: number;
  y: number;
  deleted: boolean;
}

export interface ScheduledPostProductTag {
  productName?: string;
  productId?: string;
  x?: number;
  y?: number;
  catalogId?: string;
}

export interface InstagramCollaboratorTag {
  username?: string;
  deleted?: boolean;
}

export interface ScheduledPostInstagramData {
  autoPublish?: boolean;
  tags?: ScheduledPostImageTag[];
  productTags?: ScheduledPostProductTag[];
  carouselTags?: Record<string, ScheduledPostImageTag[]>;
  carouselProductTags?: Record<string, ScheduledPostProductTag[]>;
  type?: string;
  showReelOnFeed?: boolean;
  boost?: number;
  boostPayer?: string;
  boostBeneficiary?: string;
  audioName?: string;
  collaborators?: InstagramCollaboratorTag[];
  shareTrialAutomatically?: boolean;
}

export interface ScheduledPostTikTokTrack {
  musicId?: string;
  title?: string;
  author?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  soundVolume?: number;
  originalVolume?: number;
  startMillis?: number;
  endMillis?: number;
}

export interface ScheduledPostTikTokData {
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
  privacyOption?: string;
  commercialContentThirdParty?: boolean;
  commercialContentOwnBrand?: boolean;
  title?: string;
  autoAddMusic?: boolean;
  photoCoverIndex?: number;
  music?: ScheduledPostTikTokTrack;
}

export interface ScheduledPostYoutubeData {
  title?: string;
  type?: string;
  privacy?: string;
  tags?: string[];
  category?: string;
  playlistId?: string;
  madeForKids?: boolean;
}

export interface ScheduledPostLinkedinPollOption {
  text?: string;
}

export interface ScheduledPostLinkedinPollSettings {
  duration?: string;
}

export interface ScheduledPostLinkedinPoll {
  question?: string;
  options?: ScheduledPostLinkedinPollOption[];
  settings?: ScheduledPostLinkedinPollSettings;
}

export interface ScheduledPostLinkedinData {
  documentTitle?: string;
  publishImagesAsPDF?: boolean;
  previewIncluded?: boolean;
  type?: string;
  poll?: ScheduledPostLinkedinPoll;
}

export interface ScheduledPostBlueskyData {
  postLanguages?: string[];
}

export interface ScheduledPostThreadsData {
  type: string; // "POST" | "GHOST"
  allowedCountryCodes?: string[];
  isSpoiler?: boolean;
  replyControl?: string;
}

export interface ScheduledPostFacebookData {
  boost?: number;
  boostPayer?: string;
  boostBeneficiary?: string;
  type?: string;
  title?: string;
}

export interface ScheduledPostTwitterPollOption {
  text?: string;
}

export interface ScheduledPostTwitterPollSettings {
  durationMinutes?: number;
}

export interface ScheduledPostTwitterPoll {
  options?: ScheduledPostTwitterPollOption[];
  settings?: ScheduledPostTwitterPollSettings;
}

export interface ScheduledPostTwitterData {
  tags?: ScheduledPostImageTag[];
  replySettings?: string;
  type?: string;
  poll?: ScheduledPostTwitterPoll;
  isPollChild?: boolean;
}

export interface ScheduledPostPinterestData {
  boardId?: string;
  pinTitle?: string;
  pinLink?: string;
  pinNewFormat?: boolean;
}

export interface ScheduledPostSmartLinkData {
  smartLinkId?: string;
  buttonText?: string;
}

export interface ScheduledPostGmbData {
  eventTitle?: string;
  eventStartDate?: DateTimeInfo;
  eventEndDate?: DateTimeInfo;
  ctaType?: string;
  ctaUrl?: string;
  topicType?: string;
  offerCouponCode?: string;
  offerRedeemOnlineUrl?: string;
  offerTermsConditions?: string;
}

export interface ScheduledPostAutolistData {
  autolistId?: number;
  slotId?: number;
}

export interface ScheduledPostLocationCoordinates {
  city?: string;
  country?: string;
  state?: string;
  street?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
}

export interface ScheduledPostLocation {
  name?: string;
  link?: string;
  id?: string;
  location?: ScheduledPostLocationCoordinates;
  deleted?: boolean;
}

// ─── Approval Workflow ───────────────────────────────────────────────────────

export interface ScheduledPostApprovalEvent {
  postUuid?: string;
  postId?: number;
  reviewerId?: number;
  reviewerMail?: string;
  status?: string;
  updatedDate?: DateTimeInfo;
  deletedDate?: DateTimeInfo;
  deleted?: boolean;
}

export interface ScheduledPostApprovalData {
  approvalStatus?: string;
  approvalCriteria?: string;
  approvalEvents: ScheduledPostApprovalEvent[];
  sendMailToReviewers?: boolean;
  saveData?: boolean;
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export interface ScheduledPostNote {
  id: number;
  postId: number;
  userId?: number;
  agencyId?: number;
  userName?: string;
  created: DateTimeInfo;
  content?: string;
  updatedDate?: DateTimeInfo;
  updated?: boolean;
  deletedDate?: DateTimeInfo;
  deleted?: boolean;
}

// ─── Scheduled Post ──────────────────────────────────────────────────────────

export interface ScheduledPost {
  id?: number;
  publicationDate: DateTimeInfo;
  creationDate?: DateTimeInfo;
  text: string;
  firstCommentText?: string;
  providers: ProviderStatus[];
  media?: string[];
  autoPublish?: boolean;
  saveExternalMediaFiles?: boolean;
  mediaAltText?: string[];
  shortener?: boolean;
  draft?: boolean;
  location?: ScheduledPostLocation;
  videoCoverMilliseconds?: number;
  videoThumbnailUrl?: string;
  parentId?: number;

  // Platform-specific data
  twitterData?: ScheduledPostTwitterData;
  facebookData?: ScheduledPostFacebookData;
  smartLinkData?: ScheduledPostSmartLinkData;
  instagramData?: ScheduledPostInstagramData;
  pinterestData?: ScheduledPostPinterestData;
  youtubeData?: ScheduledPostYoutubeData;
  tiktokData?: ScheduledPostTikTokData;
  linkedinData?: ScheduledPostLinkedinData;
  autolistData?: ScheduledPostAutolistData;
  gmbData?: ScheduledPostGmbData;
  threadsData?: ScheduledPostThreadsData;
  blueskyData?: ScheduledPostBlueskyData;

  // Meta
  brandName?: string;
  targetBrandId?: number;
  descendants?: ScheduledPost[];
  notes?: ScheduledPostNote[];
  hasNotReadNotes?: boolean;
  uuid?: string;
  copiedFrom?: string;

  // Creator
  creatorUserMail?: string;
  creatorUserId?: number;
  creatorAgencyUserMail?: string;
  creatorAgencyId?: number;
  creatorAgencyUserId?: number;

  // Approval
  postApprovalData?: ScheduledPostApprovalData;
  libraryPostId?: number;
}

// ─── Best Times ──────────────────────────────────────────────────────────────

export interface BestTimesByHour {
  hourOfDay: number;
  value: number;
}

export interface BestTimes {
  dayOfWeek: number;
  bestTimesByHour: BestTimesByHour[];
}

export type BestTimesProvider =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'youtube';

// ─── Media Upload ────────────────────────────────────────────────────────────

export interface S3PresignedUploadRequest {
  directory?: string;
  contentType: string;
  size: number;
  fileExtension?: string;
  bucket?: string;
}

export interface S3PartPresignedUrl {
  partNumber: number;
  presignedUrl: string;
  partSize: number;
  startByte: number;
  endByte: number;
}

export interface S3UploadResponse {
  key: string;
  bucket: string;
  expiresAt: string;
  fileUrl?: string;
  presignedUrl?: string; // Simple upload (<5MB)
  uploadId?: string; // Multipart upload (>=5MB)
  parts?: S3PartPresignedUrl[];
  partSize?: number;
  totalSize?: number;
  uploadType: 'SIMPLE' | 'MULTIPART';
}

export interface S3CompletedPart {
  partNumber: number;
  etag: string;
}

export interface S3CompleteUploadRequest {
  uploadId: string;
  key: string;
  bucket?: string;
  parts: S3CompletedPart[];
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export interface AssistantMessageRequest {
  prompt?: string;
  imageUrl?: boolean;
  tone?: string;
  language?: string;
  network?: string;
  instructions?: string;
}

export interface AssistantMessageResponse {
  threadId?: string;
  content?: string;
  contentList?: string[];
  spentCredits?: number;
  userPrompt?: string;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface MetricoolApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface MetricoolListResponse<T> {
  ok: boolean;
  data?: T[];
  error?: string;
}

// ─── Social API Proxy ────────────────────────────────────────────────────────

export interface SocialApiProxyRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  queryParams?: Record<string, string>;
  blogId?: string;
}

// ─── GigPigs Automation Types ────────────────────────────────────────────────

export type ContentTriggerType =
  | 'event_created'
  | 'lineup_changed'
  | 'ticket_milestone'
  | 'manual';

export type ContentQueueStatus =
  | 'pending'
  | 'generating'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'failed';

export type ContentDraftStatus =
  | 'draft'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'published';

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'twitter'
  | 'youtube'
  | 'linkedin'
  | 'threads'
  | 'bluesky';

export type PostType =
  | 'post'
  | 'reel'
  | 'story'
  | 'short'
  | 'thread';

export interface ContentQueueItem {
  id: string;
  trigger_type: ContentTriggerType;
  trigger_entity_id?: string;
  trigger_data: Record<string, unknown>;
  status: ContentQueueStatus;
  priority: number;
  created_at: string;
  processed_at?: string;
  error_message?: string;
}

export interface ContentDraft {
  id: string;
  queue_id?: string;
  platform: SocialPlatform;
  post_type: PostType;
  caption: string;
  media_urls?: string[];
  media_type?: string;
  hashtags?: string[];
  scheduled_for?: string;
  metricool_post_id?: number;
  status: ContentDraftStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  ai_model?: string;
  ai_prompt_used?: string;
  created_at: string;
}

export interface ContentPerformance {
  id: string;
  draft_id: string;
  platform: SocialPlatform;
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  engagement_rate?: number;
  collected_at: string;
  raw_data?: Record<string, unknown>;
}

export type SchedulingStrategy = 'best_time' | 'immediate' | 'custom';

export interface AutomationRule {
  id: string;
  organization_id?: string;
  trigger_type: ContentTriggerType;
  platforms: SocialPlatform[];
  post_types: PostType[];
  is_active: boolean;
  template_prompt?: string;
  scheduling_strategy: SchedulingStrategy;
  custom_schedule?: Record<string, unknown>;
  created_at: string;
}

// ─── Metricool Network Identifiers ──────────────────────────────────────────

/** Maps GigPigs platform names to Metricool provider network strings */
export const METRICOOL_NETWORKS: Record<SocialPlatform, string> = {
  instagram: 'INSTAGRAM',
  facebook: 'FACEBOOK',
  tiktok: 'TIKTOK',
  twitter: 'TWITTER',
  youtube: 'YOUTUBE',
  linkedin: 'LINKEDIN',
  threads: 'THREADS',
  bluesky: 'BLUESKY',
} as const;
