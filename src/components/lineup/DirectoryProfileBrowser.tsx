/**
 * DirectoryProfileBrowser Component
 *
 * Allows searching and selecting unclaimed directory profiles
 * for adding to event lineups during pre-launch testing.
 */

import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Search, Users, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useDirectoryProfiles, type DirectoryProfileSearchResult } from '@/hooks/useDirectoryProfiles';
import { cn } from '@/lib/utils';

interface DirectoryProfileBrowserProps {
  /** IDs of profiles already assigned to spots (to filter out) */
  assignedProfileIds?: string[];
}

export function DirectoryProfileBrowser({
  assignedProfileIds = [],
}: DirectoryProfileBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: profiles, isLoading } = useDirectoryProfiles({
    query: searchQuery,
    unclaimedOnly: true,
    limit: 50,
    enabled: isOpen, // Only fetch when expanded
  });

  // Filter out already-assigned profiles
  const availableProfiles = useMemo(() => {
    if (!profiles) return [];
    const assignedSet = new Set(assignedProfileIds);
    return profiles.filter((p) => !assignedSet.has(p.id));
  }, [profiles, assignedProfileIds]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 hover:bg-amber-500/10"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-700">
                Directory Profiles (Unclaimed)
              </span>
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                Pre-launch
              </Badge>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-amber-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-amber-600" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search unclaimed profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Profile List */}
            <ScrollArea className="h-[200px]">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2 p-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : availableProfiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery
                    ? 'No unclaimed profiles match your search'
                    : 'No unclaimed profiles available'}
                </div>
              ) : (
                <div className="space-y-1">
                  {availableProfiles.map((profile) => (
                    <DraggableDirectoryProfile
                      key={profile.id}
                      profile={profile}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
              Drag profiles to lineup spots. These are pre-created profiles that comedians can claim when they sign up.
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/**
 * Draggable directory profile item
 */
function DraggableDirectoryProfile({
  profile,
}: {
  profile: DirectoryProfileSearchResult;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `directory-${profile.id}`,
    data: {
      type: 'directory-profile',
      directoryProfileId: profile.id,
      profileName: profile.stage_name,
      profileAvatar: profile.primary_headshot_url,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md cursor-grab active:cursor-grabbing',
        'hover:bg-amber-500/10 transition-colors',
        isDragging && 'opacity-50'
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={profile.primary_headshot_url || undefined} />
        <AvatarFallback className="text-xs bg-amber-100 text-amber-700">
          {profile.stage_name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{profile.stage_name}</p>
        {profile.origin_city && (
          <p className="text-xs text-muted-foreground truncate">
            {profile.origin_city}
          </p>
        )}
      </div>
      {profile.photo_count > 0 && (
        <Badge variant="secondary" className="text-xs shrink-0">
          {profile.photo_count} photos
        </Badge>
      )}
    </div>
  );
}

export default DirectoryProfileBrowser;
