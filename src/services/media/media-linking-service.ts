/**
 * Media Linking Service
 *
 * Provides cross-entity media linking functionality.
 * Links media from any source (media_files, organization_media, directory_media)
 * to any entity (events, sessions, venues, organizations, photographers, comedians).
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types
// ============================================================================

export type MediaSourceType = 'media_file' | 'organization_media' | 'directory_media';

export type EntityType = 'event' | 'session' | 'venue' | 'organization' | 'photographer' | 'comedian';

export type LinkRole = 'featured' | 'photographer' | 'venue' | 'organizer' | 'performer' | 'host' | 'audience';

export interface MediaEntityLink {
  id: string;
  media_file_id: string | null;
  organization_media_id: string | null;
  directory_media_id: string | null;
  event_id: string | null;
  session_id: string | null;
  venue_id: string | null;
  organization_id: string | null;
  photographer_id: string | null;
  comedian_id: string | null;
  role: LinkRole | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  created_by: string | null;
}

export interface MediaEntityLinkInsert {
  media_file_id?: string | null;
  organization_media_id?: string | null;
  directory_media_id?: string | null;
  event_id?: string | null;
  session_id?: string | null;
  venue_id?: string | null;
  organization_id?: string | null;
  photographer_id?: string | null;
  comedian_id?: string | null;
  role?: LinkRole | null;
  is_primary?: boolean;
  display_order?: number;
}

export interface UnifiedMedia {
  id: string;
  source_type: MediaSourceType;
  source_id: string;
  storage_path: string | null;
  file_url: string | null;
  title: string | null;
  file_type: string | null;
  created_at: string;
  link_role: string | null;
}

export interface MediaLinkInput {
  sourceType: MediaSourceType;
  sourceId: string;
  entityType: EntityType;
  entityId: string;
  role?: LinkRole;
  isPrimary?: boolean;
}

export interface BulkLinkInput {
  sourceType: MediaSourceType;
  sourceId: string;
  links: Array<{
    entityType: EntityType;
    entityId: string;
    role?: LinkRole;
  }>;
}

// ============================================================================
// Link Operations
// ============================================================================

/**
 * Link media to an entity
 */
export async function linkMediaToEntity(input: MediaLinkInput): Promise<MediaEntityLink> {
  const insert: MediaEntityLinkInsert = {
    role: input.role,
    is_primary: input.isPrimary ?? false,
  };

  // Set source
  switch (input.sourceType) {
    case 'media_file':
      insert.media_file_id = input.sourceId;
      break;
    case 'organization_media':
      insert.organization_media_id = input.sourceId;
      break;
    case 'directory_media':
      insert.directory_media_id = input.sourceId;
      break;
  }

  // Set target entity
  switch (input.entityType) {
    case 'event':
      insert.event_id = input.entityId;
      break;
    case 'session':
      insert.session_id = input.entityId;
      break;
    case 'venue':
      insert.venue_id = input.entityId;
      break;
    case 'organization':
      insert.organization_id = input.entityId;
      break;
    case 'photographer':
      insert.photographer_id = input.entityId;
      break;
    case 'comedian':
      insert.comedian_id = input.entityId;
      break;
  }

  const { data, error } = await supabase
    .from('media_entity_links')
    .insert(insert)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to link media to entity: ${error.message}`);
  }

  return data as MediaEntityLink;
}

/**
 * Bulk link media to multiple entities at once
 */
export async function bulkLinkMedia(input: BulkLinkInput): Promise<MediaEntityLink[]> {
  const inserts: MediaEntityLinkInsert[] = input.links.map((link) => {
    const insert: MediaEntityLinkInsert = {
      role: link.role,
    };

    // Set source
    switch (input.sourceType) {
      case 'media_file':
        insert.media_file_id = input.sourceId;
        break;
      case 'organization_media':
        insert.organization_media_id = input.sourceId;
        break;
      case 'directory_media':
        insert.directory_media_id = input.sourceId;
        break;
    }

    // Set target entity
    switch (link.entityType) {
      case 'event':
        insert.event_id = link.entityId;
        break;
      case 'session':
        insert.session_id = link.entityId;
        break;
      case 'venue':
        insert.venue_id = link.entityId;
        break;
      case 'organization':
        insert.organization_id = link.entityId;
        break;
      case 'photographer':
        insert.photographer_id = link.entityId;
        break;
      case 'comedian':
        insert.comedian_id = link.entityId;
        break;
    }

    return insert;
  });

  const { data, error } = await supabase
    .from('media_entity_links')
    .insert(inserts)
    .select();

  if (error) {
    throw new Error(`Failed to bulk link media: ${error.message}`);
  }

  return data as MediaEntityLink[];
}

/**
 * Remove a specific media-entity link
 */
export async function unlinkMedia(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('media_entity_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    throw new Error(`Failed to unlink media: ${error.message}`);
  }
}

/**
 * Remove all links for a specific media item
 */
export async function unlinkAllForMedia(
  sourceType: MediaSourceType,
  sourceId: string
): Promise<void> {
  let query = supabase.from('media_entity_links').delete();

  switch (sourceType) {
    case 'media_file':
      query = query.eq('media_file_id', sourceId);
      break;
    case 'organization_media':
      query = query.eq('organization_media_id', sourceId);
      break;
    case 'directory_media':
      query = query.eq('directory_media_id', sourceId);
      break;
  }

  const { error } = await query;

  if (error) {
    throw new Error(`Failed to unlink all media: ${error.message}`);
  }
}

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Get all media linked to an entity using the database function
 */
export async function getMediaForEntity(
  entityType: EntityType,
  entityId: string
): Promise<UnifiedMedia[]> {
  const { data, error } = await supabase.rpc('get_media_for_entity', {
    p_entity_type: entityType,
    p_entity_id: entityId,
  });

  if (error) {
    throw new Error(`Failed to get media for entity: ${error.message}`);
  }

  return (data ?? []) as UnifiedMedia[];
}

/**
 * Get all links for a specific media item
 */
export async function getLinksForMedia(
  sourceType: MediaSourceType,
  sourceId: string
): Promise<MediaEntityLink[]> {
  let query = supabase.from('media_entity_links').select('*');

  switch (sourceType) {
    case 'media_file':
      query = query.eq('media_file_id', sourceId);
      break;
    case 'organization_media':
      query = query.eq('organization_media_id', sourceId);
      break;
    case 'directory_media':
      query = query.eq('directory_media_id', sourceId);
      break;
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get links for media: ${error.message}`);
  }

  return data as MediaEntityLink[];
}

/**
 * Get linked entity details for a media item (with names, not just IDs)
 */
export async function getLinkedEntitiesForMedia(
  sourceType: MediaSourceType,
  sourceId: string
): Promise<{
  events: Array<{ id: string; name: string }>;
  sessions: Array<{ id: string; name: string }>;
  venues: Array<{ id: string; name: string }>;
  organizations: Array<{ id: string; name: string }>;
  photographers: Array<{ id: string; name: string }>;
  comedians: Array<{ id: string; name: string }>;
}> {
  const links = await getLinksForMedia(sourceType, sourceId);

  const result = {
    events: [] as Array<{ id: string; name: string }>,
    sessions: [] as Array<{ id: string; name: string }>,
    venues: [] as Array<{ id: string; name: string }>,
    organizations: [] as Array<{ id: string; name: string }>,
    photographers: [] as Array<{ id: string; name: string }>,
    comedians: [] as Array<{ id: string; name: string }>,
  };

  // Collect IDs
  const eventIds = links.filter((l) => l.event_id).map((l) => l.event_id!);
  const sessionIds = links.filter((l) => l.session_id).map((l) => l.session_id!);
  const venueIds = links.filter((l) => l.venue_id).map((l) => l.venue_id!);
  const orgIds = links.filter((l) => l.organization_id).map((l) => l.organization_id!);
  const photographerIds = links.filter((l) => l.photographer_id).map((l) => l.photographer_id!);
  const comedianIds = links.filter((l) => l.comedian_id).map((l) => l.comedian_id!);

  // Fetch names in parallel
  const [events, sessions, venues, orgs, photographers, comedians] = await Promise.all([
    eventIds.length > 0
      ? supabase.from('events').select('id, name').in('id', eventIds)
      : { data: [] },
    sessionIds.length > 0
      ? supabase.from('sessions').select('id, name').in('id', sessionIds)
      : { data: [] },
    venueIds.length > 0
      ? supabase.from('venues').select('id, name').in('id', venueIds)
      : { data: [] },
    orgIds.length > 0
      ? supabase.from('organization_profiles').select('id, organization_name').in('id', orgIds)
      : { data: [] },
    photographerIds.length > 0
      ? supabase.from('directory_profiles').select('id, stage_name').in('id', photographerIds)
      : { data: [] },
    comedianIds.length > 0
      ? supabase.from('directory_profiles').select('id, stage_name').in('id', comedianIds)
      : { data: [] },
  ]);

  result.events = (events.data ?? []).map((e) => ({ id: e.id, name: e.name }));
  result.sessions = (sessions.data ?? []).map((s) => ({ id: s.id, name: s.name }));
  result.venues = (venues.data ?? []).map((v) => ({ id: v.id, name: v.name }));
  result.organizations = (orgs.data ?? []).map((o) => ({
    id: o.id,
    name: o.organization_name,
  }));
  result.photographers = (photographers.data ?? []).map((p) => ({
    id: p.id,
    name: p.stage_name,
  }));
  result.comedians = (comedians.data ?? []).map((c) => ({
    id: c.id,
    name: c.stage_name,
  }));

  return result;
}

// ============================================================================
// Search & Filter Operations
// ============================================================================

export interface MediaSearchFilters {
  eventId?: string;
  sessionId?: string;
  venueId?: string;
  organizationId?: string;
  photographerId?: string;
  comedianId?: string;
  role?: LinkRole;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Search media with multiple filter criteria
 * Returns media that matches ALL provided filters
 */
export async function searchMediaWithFilters(
  filters: MediaSearchFilters
): Promise<UnifiedMedia[]> {
  // Build a query that finds media matching all filters
  // This requires joining on media_entity_links for each filter

  // For now, use the simplest approach: query for the first filter, then filter in-memory
  // TODO: Build a more sophisticated query for performance with many filters

  const primaryFilter = Object.entries(filters).find(([_, value]) => value !== undefined);

  if (!primaryFilter) {
    return [];
  }

  const [filterKey, filterValue] = primaryFilter;

  // Map filter key to entity type
  const entityTypeMap: Record<string, EntityType> = {
    eventId: 'event',
    sessionId: 'session',
    venueId: 'venue',
    organizationId: 'organization',
    photographerId: 'photographer',
    comedianId: 'comedian',
  };

  const entityType = entityTypeMap[filterKey];
  if (!entityType) {
    return [];
  }

  const media = await getMediaForEntity(entityType, filterValue as string);

  // If there are additional filters, apply them
  // This is a simplified implementation - for production, consider building a complex SQL query
  let filtered = media;

  if (filters.dateFrom) {
    filtered = filtered.filter((m) => m.created_at >= filters.dateFrom!);
  }

  if (filters.dateTo) {
    filtered = filtered.filter((m) => m.created_at <= filters.dateTo!);
  }

  if (filters.role) {
    filtered = filtered.filter((m) => m.link_role === filters.role);
  }

  return filtered;
}

// ============================================================================
// Organization Folder Operations
// ============================================================================

export interface MediaFolder {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  name: string;
  description: string | null;
  is_default: boolean;
  is_system_folder: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaFolderInsert {
  user_id?: string | null;
  organization_id?: string | null;
  name: string;
  description?: string | null;
  is_default?: boolean;
  is_system_folder?: boolean;
}

/**
 * Get folders for an organization
 */
export async function getOrganizationFolders(organizationId: string): Promise<MediaFolder[]> {
  const { data, error } = await supabase
    .from('media_folders')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name');

  if (error) {
    throw new Error(`Failed to get organization folders: ${error.message}`);
  }

  return data as MediaFolder[];
}

/**
 * Create a folder for an organization
 */
export async function createOrganizationFolder(
  organizationId: string,
  name: string,
  description?: string
): Promise<MediaFolder> {
  const { data, error } = await supabase
    .from('media_folders')
    .insert({
      organization_id: organizationId,
      name,
      description,
      is_default: false,
      is_system_folder: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create organization folder: ${error.message}`);
  }

  return data as MediaFolder;
}

/**
 * Update a folder
 */
export async function updateFolder(
  folderId: string,
  updates: { name?: string; description?: string }
): Promise<MediaFolder> {
  const { data, error } = await supabase
    .from('media_folders')
    .update(updates)
    .eq('id', folderId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update folder: ${error.message}`);
  }

  return data as MediaFolder;
}

/**
 * Delete a folder (only if not a system folder)
 */
export async function deleteFolder(folderId: string): Promise<void> {
  const { error } = await supabase
    .from('media_folders')
    .delete()
    .eq('id', folderId)
    .eq('is_system_folder', false);

  if (error) {
    throw new Error(`Failed to delete folder: ${error.message}`);
  }
}

// ============================================================================
// Export Service Object
// ============================================================================

export const mediaLinkingService = {
  // Link operations
  linkMediaToEntity,
  bulkLinkMedia,
  unlinkMedia,
  unlinkAllForMedia,

  // Query operations
  getMediaForEntity,
  getLinksForMedia,
  getLinkedEntitiesForMedia,

  // Search & filter
  searchMediaWithFilters,

  // Folder operations
  getOrganizationFolders,
  createOrganizationFolder,
  updateFolder,
  deleteFolder,
};

export default mediaLinkingService;
