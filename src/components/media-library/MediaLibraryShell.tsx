/**
 * MediaLibraryShell Component
 *
 * Themed shell for the Media Library page that wraps Filestash with:
 * - Platform-consistent header with scope selector
 * - Sidebar for quick navigation (optional)
 * - Main area containing FilestashEmbed
 * - Metadata panel for file properties (future)
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useOrganizationProfiles } from '@/hooks/useOrganizationProfiles';
import { MediaBrowser } from '@/components/media/MediaBrowser';
import { UserPhotoGallery } from '@/components/media-library/UserPhotoGallery';
import { MediaUploadDialog } from '@/components/media-library/MediaUploadDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  FolderOpen,
  Image,
  Images,
  Video,
  FileText,
  Settings,
  HelpCircle,
  RefreshCw,
  User,
  Building2,
  Camera,
  Mic,
  Clock,
  Check,
  X,
  Loader2,
  Upload,
  Filter,
  Calendar,
  MapPin,
  Search,
  FolderPlus,
  Share2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { directoryService } from '@/services/directory';
import { mediaLinkingService, type MediaFolder } from '@/services/media';
import type { DirectoryProfile, DirectoryMedia, DirectoryMediaProfile } from '@/types/directory';
import { AlbumGrid, AlbumDetailView, type AlbumWithCover, type AlbumOwnerType } from '@/components/media-library/albums';
import { SharedTab } from '@/components/media-library/sharing';

export interface MediaScope {
  type: 'profile' | 'organization';
  id: string;
  slug: string;
  name: string;
  icon: 'user' | 'comedian' | 'photographer' | 'organization';
  buckets: string[];
}

interface MediaLibraryShellProps {
  className?: string;
}

interface PendingTag {
  media: DirectoryMedia;
  link: DirectoryMediaProfile;
}

export function MediaLibraryShell({ className }: MediaLibraryShellProps) {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { theme } = useTheme();
  const { data: organizations, isLoading: orgsLoading } = useOrganizationProfiles();

  // Selected scope (profile or organization)
  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(null);

  // Upload dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Folder management state
  const [orgFolders, setOrgFolders] = useState<MediaFolder[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterEventId, setFilterEventId] = useState<string | null>(null);
  const [filterPhotographerId, setFilterPhotographerId] = useState<string | null>(null);
  const [filterVenueId, setFilterVenueId] = useState<string | null>(null);

  // Pending photo tags state
  const [directoryProfile, setDirectoryProfile] = useState<DirectoryProfile | null>(null);
  const [pendingTags, setPendingTags] = useState<PendingTag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  // Media counts for Quick Stats
  const [mediaCounts, setMediaCounts] = useState<{ images: number; videos: number; documents: number }>({
    images: 0,
    videos: 0,
    documents: 0,
  });

  // Album state
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithCover | null>(null);
  const [albumRefreshKey, setAlbumRefreshKey] = useState(0);

  // Load user's directory profile and pending tags
  useEffect(() => {
    const loadPendingTags = async () => {
      if (!user?.id) return;

      setIsLoadingTags(true);
      try {
        // Get user's directory profile
        const profile = await directoryService.getDirectoryProfileByUserId(user.id);
        setDirectoryProfile(profile);

        if (profile) {
          // Get pending tags for this profile
          const tags = await directoryService.getPendingTagsForProfile(profile.id);
          setPendingTags(tags);
        }
      } catch (error) {
        console.error('Failed to load pending tags:', error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    loadPendingTags();
  }, [user?.id]);

  // Load media counts for Quick Stats
  useEffect(() => {
    const loadMediaCounts = async () => {
      if (!user?.id) return;

      try {
        // Query media_files for this user (includes migrated directory_media)
        // Count by user_id OR directory_profile_id (for claimed profiles)
        let query = supabase
          .from('media_files')
          .select('file_type, media_type, external_type');

        // If user has a directory profile, include media from both sources
        if (directoryProfile?.id) {
          query = query.or(`user_id.eq.${user.id},directory_profile_id.eq.${directoryProfile.id}`);
        } else {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Count by type
        const counts = { images: 0, videos: 0, documents: 0 };
        data?.forEach((item) => {
          const mediaType = item.media_type || 'photo';
          const fileType = item.file_type || '';
          const externalType = item.external_type;

          // Videos: either media_type is video, or external_type indicates video
          if (mediaType === 'video' || externalType === 'youtube' || externalType === 'vimeo') {
            counts.videos++;
          }
          // Images: photo type or image file types
          else if (mediaType === 'photo' || fileType.startsWith('image')) {
            counts.images++;
          }
          // Everything else is documents
          else {
            counts.documents++;
          }
        });

        setMediaCounts(counts);
      } catch (error) {
        console.error('Failed to load media counts:', error);
      }
    };

    loadMediaCounts();
  }, [user?.id, directoryProfile?.id, refreshKey]);

  // Handle upload complete
  const handleUploadComplete = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Handle approve/reject tag
  const handleRespondToTag = async (tag: PendingTag, approved: boolean) => {
    if (!directoryProfile) return;

    setRespondingTo(tag.link.id);
    try {
      await directoryService.respondToTag(tag.link.media_id, tag.link.profile_id, approved);
      // Remove from list
      setPendingTags((prev) => prev.filter((t) => t.link.id !== tag.link.id));
    } catch (error) {
      console.error('Failed to respond to tag:', error);
    } finally {
      setRespondingTo(null);
    }
  };

  // Get photo URL
  const getPhotoUrl = (media: DirectoryMedia) => {
    if (media.public_url) return media.public_url;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/directory-media/${media.storage_path}`;
  };

  // Build available scopes from user profile and organizations
  const availableScopes = useMemo<MediaScope[]>(() => {
    const scopes: MediaScope[] = [];

    // Add user's profile scope
    if (activeProfile) {
      const profileRole = activeProfile.role;
      let icon: MediaScope['icon'] = 'user';

      if (profileRole === 'comedian' || profileRole === 'comedian_lite') {
        icon = 'comedian';
      } else if (profileRole === 'photographer') {
        icon = 'photographer';
      }

      scopes.push({
        type: 'profile',
        id: activeProfile.id,
        slug: activeProfile.profile_slug || activeProfile.id,
        name: activeProfile.name || 'My Profile',
        icon,
        buckets: ['profile-images', 'comedian-media'],
      });
    }

    // Add organization scopes
    if (organizations) {
      Object.values(organizations).forEach((org) => {
        if (org.url_slug) {
          scopes.push({
            type: 'organization',
            id: org.id,
            slug: org.url_slug,
            name: org.display_name || org.organization_name || 'Organization',
            icon: 'organization',
            buckets: ['organization-media', 'event-media'],
          });
        }
      });
    }

    return scopes;
  }, [activeProfile, organizations]);

  // Current selected scope
  const currentScope = useMemo(() => {
    if (!selectedScopeId && availableScopes.length > 0) {
      return availableScopes[0];
    }
    return availableScopes.find((s) => s.id === selectedScopeId) || availableScopes[0] || null;
  }, [selectedScopeId, availableScopes]);

  // Load organization folders when scope changes
  useEffect(() => {
    const loadOrgFolders = async () => {
      if (currentScope?.type === 'organization') {
        try {
          const folders = await mediaLinkingService.getOrganizationFolders(currentScope.id);
          setOrgFolders(folders);
        } catch (error) {
          console.error('Failed to load org folders:', error);
          setOrgFolders([]);
        }
      } else {
        setOrgFolders([]);
      }
    };
    loadOrgFolders();
  }, [currentScope?.id, currentScope?.type]);

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!currentScope || currentScope.type !== 'organization' || !newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const folder = await mediaLinkingService.createOrganizationFolder(
        currentScope.id,
        newFolderName.trim()
      );
      setOrgFolders((prev) => [...prev, folder]);
      setNewFolderName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const getBackgroundStyles = () => {
    return 'bg-[#131b2b]';
  };

  // Icon component for scope
  const ScopeIcon = ({ icon }: { icon: MediaScope['icon'] }) => {
    switch (icon) {
      case 'comedian':
        return <Mic className="h-4 w-4" />;
      case 'photographer':
        return <Camera className="h-4 w-4" />;
      case 'organization':
        return <Building2 className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', getBackgroundStyles())}>
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p className="text-muted-foreground">
              You need to be logged in to access the media library.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen', getBackgroundStyles(), className)}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Title and Scope Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-6 w-6 text-white" />
                <h1 className="text-xl font-semibold text-white">Media Library</h1>
              </div>

              {/* Scope Selector */}
              {availableScopes.length > 1 && (
                <Select
                  value={currentScope?.id || ''}
                  onValueChange={(value) => setSelectedScopeId(value)}
                >
                  <SelectTrigger className="w-[220px] bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select folder">
                      {currentScope && (
                        <div className="flex items-center gap-2">
                          <ScopeIcon icon={currentScope.icon} />
                          <span className="truncate">{currentScope.name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableScopes.map((scope) => (
                      <SelectItem key={scope.id} value={scope.id}>
                        <div className="flex items-center gap-2">
                          <ScopeIcon icon={scope.icon} />
                          <span>{scope.name}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {scope.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {availableScopes.length === 1 && currentScope && (
                <Badge className="bg-white/20 text-white border-white/30">
                  <ScopeIcon icon={currentScope.icon} />
                  <span className="ml-1">{currentScope.name}</span>
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowUploadDialog(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-white hover:bg-white/10',
                  showFilters && 'bg-white/20'
                )}
                onClick={() => setShowFilters(!showFilters)}
                title="Toggle Filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                title="Refresh"
                onClick={() => setRefreshKey((k) => k + 1)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                title="Help"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Media Browser (Main Area) */}
          <div className="min-h-[70vh]">
            {selectedAlbum ? (
              <Card className="h-full overflow-hidden">
                <CardContent className="p-0 h-full">
                  <AlbumDetailView
                    album={selectedAlbum}
                    onBack={() => setSelectedAlbum(null)}
                    onAlbumUpdated={() => setAlbumRefreshKey((k) => k + 1)}
                  />
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="photos" className="h-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="photos" className="gap-2">
                    <Images className="h-4 w-4" />
                    My Photos
                  </TabsTrigger>
                  <TabsTrigger value="albums" className="gap-2">
                    <FolderPlus className="h-4 w-4" />
                    My Albums
                  </TabsTrigger>
                  <TabsTrigger value="files" className="gap-2">
                    <FolderOpen className="h-4 w-4" />
                    All Files
                  </TabsTrigger>
                  <TabsTrigger value="shared" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Shared
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="photos" className="mt-0 h-[calc(100%-48px)]">
                  <Card className="h-full overflow-hidden">
                    <CardContent className="p-0 h-full">
                      <UserPhotoGallery />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="albums" className="mt-0 h-[calc(100%-48px)]">
                  <Card className="h-full overflow-hidden">
                    <CardContent className="p-4 h-full overflow-auto">
                      {user?.id ? (
                        selectedAlbum ? (
                          <AlbumDetailView
                            album={selectedAlbum}
                            onBack={() => setSelectedAlbum(null)}
                            onAlbumUpdated={() => setAlbumRefreshKey((k) => k + 1)}
                          />
                        ) : (
                          <AlbumGrid
                            ownerId={user.id}
                            ownerType="user"
                            onAlbumClick={(album) => setSelectedAlbum(album)}
                            onAlbumDeleted={() => setAlbumRefreshKey((k) => k + 1)}
                            refreshKey={albumRefreshKey}
                          />
                        )
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Please sign in to view your albums
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="files" className="mt-0 h-[calc(100%-48px)]">
                  <Card className="h-full overflow-hidden">
                    <CardContent className="p-0 h-full">
                      <MediaBrowser />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="shared" className="mt-0 h-[calc(100%-48px)]">
                  <Card className="h-full overflow-hidden">
                    <CardContent className="p-0 h-full">
                      <SharedTab directoryProfileId={directoryProfile?.id} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Sidebar - Quick Actions & Info */}
          <aside className="space-y-4">
            {/* Pending Photo Tags */}
            {pendingTags.length > 0 && (
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <Clock className="h-4 w-4" />
                    Pending Tags ({pendingTags.length})
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Review photos you've been tagged in
                  </p>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {pendingTags.slice(0, 5).map((tag) => (
                      <div
                        key={tag.link.id}
                        className="flex items-center gap-3 p-2 bg-background/50 rounded-lg"
                      >
                        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                          <img
                            src={getPhotoUrl(tag.media)}
                            alt={tag.media.file_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate text-muted-foreground">
                            {tag.media.file_name}
                          </p>
                          <Badge variant="secondary" className="text-[10px] mt-1">
                            {tag.link.role || 'Tagged'}
                          </Badge>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                            onClick={() => handleRespondToTag(tag, true)}
                            disabled={respondingTo !== null}
                          >
                            {respondingTo === tag.link.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100"
                            onClick={() => handleRespondToTag(tag, false)}
                            disabled={respondingTo !== null}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pendingTags.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      +{pendingTags.length - 5} more
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Current Scope Info */}
            {currentScope && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <ScopeIcon icon={currentScope.icon} />
                    {currentScope.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {currentScope.type === 'profile'
                      ? 'Your personal media files'
                      : 'Organization media files'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {currentScope.buckets.map((bucket) => (
                      <Badge key={bucket} variant="secondary" className="text-xs">
                        {bucket}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Organization Folders */}
            {currentScope?.type === 'organization' && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Folders
                  </h3>
                  <div className="space-y-2">
                    {orgFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate">{folder.name}</span>
                        {folder.is_default && (
                          <Badge variant="secondary" className="text-[10px] ml-auto">
                            Default
                          </Badge>
                        )}
                      </div>
                    ))}
                    {orgFolders.length === 0 && (
                      <p className="text-sm text-muted-foreground">No folders yet</p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="New folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8"
                      onClick={handleCreateFolder}
                      disabled={isCreatingFolder || !newFolderName.trim()}
                    >
                      {isCreatingFolder ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <FolderPlus className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Quick Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Image className="h-4 w-4" />
                      Images
                    </span>
                    <span className="font-medium">{mediaCounts.images}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Video className="h-4 w-4" />
                      Videos
                    </span>
                    <span className="font-medium">{mediaCounts.videos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Documents
                    </span>
                    <span className="font-medium">{mediaCounts.documents}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Drag and drop files to upload</li>
                  <li>Tag photos with events, venues & artists</li>
                  <li>Use folders to organize media</li>
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* Upload Dialog */}
      <MediaUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        organizationId={currentScope?.type === 'organization' ? currentScope.id : undefined}
        onUploaded={handleUploadComplete}
      />
    </div>
  );
}

export default MediaLibraryShell;
