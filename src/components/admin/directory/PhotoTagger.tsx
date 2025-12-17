/**
 * PhotoTagger Component
 *
 * Tag multiple people (directory profiles) in a photo.
 * Supports assigning roles and marking primary subject.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Search,
  Loader2,
  X,
  Star,
  UserPlus,
  Mic,
  Music,
  Camera,
  UserCircle,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { directoryService } from '@/services/directory';
import type {
  DirectoryMedia,
  DirectoryProfile,
  DirectoryMediaProfile,
  MediaProfileRole,
} from '@/types/directory';

interface PhotoTaggerProps {
  media: DirectoryMedia;
  onClose: () => void;
  onSaved?: () => void;
}

interface TaggedProfile {
  profile: DirectoryProfile;
  role: MediaProfileRole;
  isPrimary: boolean;
}

const ROLE_OPTIONS: { value: MediaProfileRole; label: string; icon: React.ElementType }[] = [
  { value: 'performer', label: 'Performer', icon: Mic },
  { value: 'dj', label: 'DJ', icon: Music },
  { value: 'host', label: 'Host', icon: UserCircle },
  { value: 'photographer', label: 'Photographer', icon: Camera },
  { value: 'audience', label: 'Audience', icon: Users },
  { value: 'other', label: 'Other', icon: UserPlus },
];

export function PhotoTagger({ media, onClose, onSaved }: PhotoTaggerProps) {
  const { theme } = useTheme();
  const { toast } = useToast();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [allProfiles, setAllProfiles] = useState<DirectoryProfile[]>([]);
  const [taggedProfiles, setTaggedProfiles] = useState<TaggedProfile[]>([]);
  const [originalLinks, setOriginalLinks] = useState<DirectoryMediaProfile[]>([]);

  const getDialogStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-purple-900/95 border-white/20 text-white';
    }
    return 'bg-gray-900 border-gray-700 text-gray-100';
  };

  // Load existing links and all profiles
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Load all profiles for selection
        const { profiles } = await directoryService.searchProfiles({}, 500, 0);
        setAllProfiles(profiles);

        // Load existing links for this photo
        const links = await directoryService.getMediaProfiles(media.id);
        setOriginalLinks(links.map(l => l.link));
        setTaggedProfiles(links.map(l => ({
          profile: l.profile,
          role: l.link.role || 'performer',
          isPrimary: l.link.is_primary_subject,
        })));
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [media.id]);

  // Filter profiles by search
  const filteredProfiles = useMemo(() => {
    const tagged = new Set(taggedProfiles.map(t => t.profile.id));
    const available = allProfiles.filter(p => !tagged.has(p.id));

    if (!search.trim()) return available;

    const searchLower = search.toLowerCase();
    return available.filter(p =>
      p.stage_name.toLowerCase().includes(searchLower) ||
      p.email?.toLowerCase().includes(searchLower)
    );
  }, [allProfiles, taggedProfiles, search]);

  // Add a profile to tagged list
  const addProfile = (profile: DirectoryProfile) => {
    setTaggedProfiles(prev => [
      ...prev,
      {
        profile,
        role: 'performer',
        isPrimary: prev.length === 0, // First one is primary by default
      },
    ]);
    setSearch('');
  };

  // Remove a profile from tagged list
  const removeProfile = (profileId: string) => {
    setTaggedProfiles(prev => {
      const updated = prev.filter(t => t.profile.id !== profileId);
      // If we removed the primary, make the first one primary
      if (updated.length > 0 && !updated.some(t => t.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  // Update role for a tagged profile
  const updateRole = (profileId: string, role: MediaProfileRole) => {
    setTaggedProfiles(prev =>
      prev.map(t =>
        t.profile.id === profileId ? { ...t, role } : t
      )
    );
  };

  // Set primary subject
  const setPrimary = (profileId: string) => {
    setTaggedProfiles(prev =>
      prev.map(t => ({
        ...t,
        isPrimary: t.profile.id === profileId,
      }))
    );
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Calculate what needs to be added/removed/updated
      const currentIds = new Set(taggedProfiles.map(t => t.profile.id));
      const originalIds = new Set(originalLinks.map(l => l.profile_id));

      // Remove untagged profiles
      for (const link of originalLinks) {
        if (!currentIds.has(link.profile_id)) {
          await directoryService.removeMediaProfile(media.id, link.profile_id);
        }
      }

      // Add or update tagged profiles
      for (const tagged of taggedProfiles) {
        if (originalIds.has(tagged.profile.id)) {
          // Update existing
          await directoryService.updateMediaProfile(media.id, tagged.profile.id, {
            role: tagged.role,
            is_primary_subject: tagged.isPrimary,
          });
        } else {
          // Add new
          await directoryService.addMediaProfile({
            media_id: media.id,
            profile_id: tagged.profile.id,
            role: tagged.role,
            is_primary_subject: tagged.isPrimary,
            can_use_for_promo: true,
          });
        }
      }

      toast({
        title: 'People Tagged',
        description: `Photo linked to ${taggedProfiles.length} profile(s)`,
      });
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      toast({
        title: 'Error',
        description: 'Failed to save tagged profiles',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get photo URL
  const getPhotoUrl = () => {
    if (media.public_url) return media.public_url;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/directory-media/${media.storage_path}`;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-hidden flex flex-col", getDialogStyles())}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tag People in Photo
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : (
          <div className="flex gap-4 flex-1 min-h-0">
            {/* Left: Photo preview */}
            <div className="w-1/2 flex flex-col gap-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                <img
                  src={getPhotoUrl()}
                  alt={media.file_name}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm text-white/60 text-center truncate">
                {media.file_name}
              </p>
            </div>

            {/* Right: Tagging interface */}
            <div className="w-1/2 flex flex-col gap-4 min-h-0">
              {/* Tagged profiles */}
              <div className="flex-1 min-h-0 flex flex-col">
                <h4 className="text-sm font-medium text-white/80 mb-2">
                  Tagged People ({taggedProfiles.length})
                </h4>

                <ScrollArea className="flex-1">
                  <div className="space-y-2 pr-4">
                    {taggedProfiles.length === 0 ? (
                      <p className="text-white/40 text-sm py-4 text-center">
                        No one tagged yet. Search and add people below.
                      </p>
                    ) : (
                      taggedProfiles.map((tagged) => (
                        <div
                          key={tagged.profile.id}
                          className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={tagged.profile.primary_headshot_url || undefined} />
                            <AvatarFallback>
                              {getInitials(tagged.profile.stage_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate flex items-center gap-2">
                              {tagged.profile.stage_name}
                              {tagged.isPrimary && (
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </p>
                            <Select
                              value={tagged.role}
                              onValueChange={(v) => updateRole(tagged.profile.id, v as MediaProfileRole)}
                            >
                              <SelectTrigger className="h-7 text-xs bg-white/10 border-white/20 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    <span className="flex items-center gap-2">
                                      <opt.icon className="h-3 w-3" />
                                      {opt.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-1">
                            {!tagged.isPrimary && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-white/60 hover:text-yellow-500"
                                onClick={() => setPrimary(tagged.profile.id)}
                                title="Set as primary subject"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-white/60 hover:text-red-400"
                              onClick={() => removeProfile(tagged.profile.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Search and add */}
              <div className="flex-shrink-0 border-t border-white/10 pt-4">
                <h4 className="text-sm font-medium text-white/80 mb-2">
                  Add Person
                </h4>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                {search.trim() && (
                  <ScrollArea className="h-40 mt-2 border border-white/10 rounded-lg">
                    <div className="p-2 space-y-1">
                      {filteredProfiles.length === 0 ? (
                        <p className="text-white/40 text-sm py-2 text-center">
                          No matching profiles found
                        </p>
                      ) : (
                        filteredProfiles.slice(0, 20).map((profile) => (
                          <button
                            key={profile.id}
                            className="w-full flex items-center gap-3 p-2 rounded hover:bg-white/10 transition-colors text-left"
                            onClick={() => addProfile(profile)}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={profile.primary_headshot_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(profile.stage_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">
                                {profile.stage_name}
                              </p>
                              {profile.email && (
                                <p className="text-xs text-white/50 truncate">
                                  {profile.email}
                                </p>
                              )}
                            </div>
                            <UserPlus className="h-4 w-4 text-white/40" />
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10 flex-shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Tags
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
