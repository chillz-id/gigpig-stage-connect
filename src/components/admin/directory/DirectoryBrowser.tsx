/**
 * DirectoryBrowser Component
 *
 * Browse, search, and manage directory profiles.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Users,
  Image,
  Mail,
  MoreVertical,
  Trash2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { directoryService } from '@/services/directory';
import { directoryImportService } from '@/services/directory/import-service';
import type { DirectoryProfile, DirectoryProfileFilters, DirectoryProfileType } from '@/types/directory';
import { DirectoryProfileCard } from './DirectoryProfileCard';
import { DirectoryProfileEditor } from './DirectoryProfileEditor';
import { DirectoryPhotoManager } from './DirectoryPhotoManager';

export function DirectoryBrowser() {
  const { theme } = useTheme();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Filters
  const [search, setSearch] = useState('');
  const [profileType, setProfileType] = useState<DirectoryProfileType | 'all'>('all');
  const [unclaimedOnly, setUnclaimedOnly] = useState(false);

  // Selected profiles for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialogs
  const [editingProfile, setEditingProfile] = useState<DirectoryProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<DirectoryProfile | null>(null);
  const [photosProfile, setPhotosProfile] = useState<DirectoryProfile | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<DirectoryProfile | null>(null);

  // CRM sync
  const [isSyncing, setIsSyncing] = useState(false);

  // Bulk actions
  const [bulkProfileType, setBulkProfileType] = useState<DirectoryProfileType | ''>('');
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/[0.08] backdrop-blur-md border-white/[0.15] text-white';
    }
    return 'bg-gray-800/90 border-gray-600 text-gray-100';
  };

  // Load profiles
  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const filters: DirectoryProfileFilters = {
        search: search || undefined,
        profile_type: profileType === 'all' ? undefined : profileType,
        unclaimed_only: unclaimedOnly,
      };

      const result = await directoryService.searchProfiles(
        filters,
        pageSize,
        page * pageSize
      );

      setProfiles(result.profiles);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load directory profiles',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [search, profileType, unclaimedOnly, page]);

  // Handle search with debounce
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Select all visible
  const selectAll = () => {
    if (selectedIds.size === profiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(profiles.map(p => p.id)));
    }
  };

  // Delete profile
  const handleDelete = async () => {
    if (!profileToDelete) return;

    try {
      await directoryService.deleteProfile(profileToDelete.id);
      toast({
        title: 'Profile Deleted',
        description: `${profileToDelete.stage_name} has been removed from the directory`,
      });
      loadProfiles();
    } catch (error) {
      console.error('Failed to delete profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete profile',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirmOpen(false);
      setProfileToDelete(null);
    }
  };

  // Sync to CRM
  const handleCRMSync = async () => {
    setIsSyncing(true);
    try {
      const profileIds = selectedIds.size > 0
        ? Array.from(selectedIds)
        : undefined;

      const result = await directoryImportService.syncDirectoryToCRM(profileIds);

      toast({
        title: 'CRM Sync Complete',
        description: `${result.synced} profiles synced to CRM${result.errors > 0 ? `, ${result.errors} errors` : ''}`,
      });
    } catch (error) {
      console.error('CRM sync failed:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync profiles to CRM',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Bulk update profile types
  const handleBulkUpdateProfileType = async () => {
    if (!bulkProfileType || selectedIds.size === 0) return;

    setIsApplyingBulk(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedIds) {
        try {
          await directoryService.updateProfile(id, { profile_type: bulkProfileType });
          successCount++;
        } catch {
          errorCount++;
        }
      }

      toast({
        title: 'Profile Types Updated',
        description: `${successCount} profile${successCount !== 1 ? 's' : ''} updated${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });

      setSelectedIds(new Set());
      setBulkProfileType('');
      loadProfiles();
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile types',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingBulk(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn(getCardStyles())}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card className={cn(getCardStyles())}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">With Email</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.filter(p => p.email).length}
            </div>
          </CardContent>
        </Card>

        <Card className={cn(getCardStyles())}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unclaimed</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.filter(p => !p.claimed_at).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and actions */}
      <Card className={cn(getCardStyles())}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            {/* Profile Type Filter */}
            <Select
              value={profileType}
              onValueChange={(value) => {
                setProfileType(value as DirectoryProfileType | 'all');
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="comedian">Comedian</SelectItem>
                <SelectItem value="comedian_lite">Comedian (Lite)</SelectItem>
                <SelectItem value="photographer">Photographer</SelectItem>
                <SelectItem value="videographer">Videographer</SelectItem>
                <SelectItem value="dj">DJ</SelectItem>
                <SelectItem value="podcast">Podcast</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="venue_manager">Venue Manager</SelectItem>
                <SelectItem value="venue">Venue</SelectItem>
              </SelectContent>
            </Select>

            {/* Unclaimed Filter */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-white/80">
                <Checkbox
                  checked={unclaimedOnly}
                  onCheckedChange={(checked) => setUnclaimedOnly(checked === true)}
                />
                Unclaimed only
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCRMSync}
                disabled={isSyncing}
                className="text-white border-white/20 hover:bg-white/10"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
                Sync to CRM
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk selection toolbar */}
      {selectedIds.size > 0 && (
        <Card className={cn(getCardStyles())}>
          <CardContent className="py-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <span className="text-sm">
                {selectedIds.size} profile{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {/* Bulk Profile Type Assignment */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/70">Profile Type:</span>
                  <Select
                    value={bulkProfileType}
                    onValueChange={(value) => setBulkProfileType(value as DirectoryProfileType)}
                  >
                    <SelectTrigger className="w-[160px] h-8 bg-white/10 border-white/20 text-white text-sm">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comedian">Comedian</SelectItem>
                      <SelectItem value="comedian_lite">Comedian (Lite)</SelectItem>
                      <SelectItem value="photographer">Photographer</SelectItem>
                      <SelectItem value="videographer">Videographer</SelectItem>
                      <SelectItem value="dj">DJ</SelectItem>
                      <SelectItem value="podcast">Podcast</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="venue_manager">Venue Manager</SelectItem>
                      <SelectItem value="venue">Venue</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkUpdateProfileType}
                    disabled={!bulkProfileType || isApplyingBulk}
                  >
                    {isApplyingBulk ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedIds(new Set());
                    setBulkProfileType('');
                  }}
                  className="text-white border-white/20"
                >
                  Clear selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile list */}
      <Card className={cn(getCardStyles())}>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-white/10 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No profiles found</p>
              <p className="text-sm mt-2">Try adjusting your search or import some profiles</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select all */}
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <Checkbox
                  checked={selectedIds.size === profiles.length && profiles.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-white/60">Select all</span>
              </div>

              {/* Profile rows */}
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setViewingProfile(profile)}
                >
                  <Checkbox
                    checked={selectedIds.has(profile.id)}
                    onCheckedChange={() => toggleSelection(profile.id)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                    {profile.primary_headshot_url ? (
                      <img
                        src={profile.primary_headshot_url}
                        alt={profile.stage_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-white/40">
                        <Users className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {profile.stage_name}
                      </span>
                      {profile.profile_type && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {profile.profile_type.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      {profile.claimed_at && (
                        <Badge variant="secondary" className="text-green-400 border-green-400/50">
                          Claimed
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-white/60 truncate">
                      {profile.email ?? 'No email'}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="hidden md:flex items-center gap-1">
                    {profile.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {profile.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{profile.tags.length - 2}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingProfile(profile)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPhotosProfile(profile)}>
                        <Image className="h-4 w-4 mr-2" />
                        Manage Photos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingProfile(profile)}>
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => {
                          setProfileToDelete(profile);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
              <span className="text-sm text-white/60">
                Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="text-white border-white/20"
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="text-white border-white/20"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {profileToDelete?.stage_name}? This will also delete
              all associated photos and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile editor dialog */}
      {editingProfile && (
        <DirectoryProfileEditor
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={() => {
            setEditingProfile(null);
            loadProfiles();
          }}
        />
      )}

      {/* Profile viewer dialog */}
      {viewingProfile && (
        <DirectoryProfileCard
          profile={viewingProfile}
          onClose={() => setViewingProfile(null)}
          onEdit={() => {
            setEditingProfile(viewingProfile);
            setViewingProfile(null);
          }}
        />
      )}

      {/* Photo manager dialog */}
      {photosProfile && (
        <DirectoryPhotoManager
          profile={photosProfile}
          onClose={() => setPhotosProfile(null)}
        />
      )}
    </div>
  );
}
