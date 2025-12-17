/**
 * PendingPhotoTags Component
 *
 * Shows pending photo tags for a profile to review and approve/reject.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { directoryService } from '@/services/directory';
import type { DirectoryProfile, DirectoryMedia, DirectoryMediaProfile } from '@/types/directory';

interface PendingPhotoTagsProps {
  profile: DirectoryProfile;
  onClose: () => void;
}

interface PendingTag {
  media: DirectoryMedia;
  link: DirectoryMediaProfile;
}

const ROLE_LABELS: Record<string, string> = {
  performer: 'Performer',
  dj: 'DJ',
  host: 'Host',
  photographer: 'Photographer',
  audience: 'Audience',
  other: 'Other',
};

export function PendingPhotoTags({ profile, onClose }: PendingPhotoTagsProps) {
  const { theme } = useTheme();
  const { toast } = useToast();

  const [pendingTags, setPendingTags] = useState<PendingTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const getDialogStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-purple-900/95 border-white/20 text-white';
    }
    return 'bg-gray-900 border-gray-700 text-gray-100';
  };

  // Load pending tags
  const loadPendingTags = async () => {
    setIsLoading(true);
    try {
      const tags = await directoryService.getPendingTagsForProfile(profile.id);
      setPendingTags(tags);
    } catch (error) {
      console.error('Failed to load pending tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending photo tags',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingTags();
  }, [profile.id]);

  // Get photo URL
  const getPhotoUrl = (media: DirectoryMedia) => {
    if (media.public_url) return media.public_url;
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/directory-media/${media.storage_path}`;
  };

  // Handle approve/reject
  const handleRespond = async (tag: PendingTag, approved: boolean) => {
    setResponding(tag.link.id);
    try {
      await directoryService.respondToTag(tag.link.media_id, tag.link.profile_id, approved);
      toast({
        title: approved ? 'Tag Approved' : 'Tag Rejected',
        description: approved
          ? 'This photo will now appear on your profile'
          : 'This photo will not appear on your profile',
      });
      // Remove from list
      setPendingTags((prev) => prev.filter((t) => t.link.id !== tag.link.id));
    } catch (error) {
      console.error('Failed to respond to tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tag',
        variant: 'destructive',
      });
    } finally {
      setResponding(null);
    }
  };

  // Approve all
  const handleApproveAll = async () => {
    setResponding('all');
    try {
      await Promise.all(
        pendingTags.map((tag) =>
          directoryService.respondToTag(tag.link.media_id, tag.link.profile_id, true)
        )
      );
      toast({
        title: 'All Tags Approved',
        description: `${pendingTags.length} photo(s) will now appear on your profile`,
      });
      setPendingTags([]);
    } catch (error) {
      console.error('Failed to approve all:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve all tags',
        variant: 'destructive',
      });
    } finally {
      setResponding(null);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className={cn('max-w-3xl max-h-[90vh] overflow-hidden flex flex-col', getDialogStyles())}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Photo Tags ({pendingTags.length})
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : pendingTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/50">
            <ImageIcon className="h-12 w-12 mb-4" />
            <p>No pending photo tags</p>
            <p className="text-sm mt-2">
              When someone tags you in a photo, it will appear here for approval
            </p>
          </div>
        ) : (
          <>
            {/* Approve all button */}
            <div className="flex justify-end pb-2 flex-shrink-0">
              <Button
                onClick={handleApproveAll}
                disabled={responding !== null}
                className="bg-green-600 hover:bg-green-700"
              >
                {responding === 'all' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Check className="h-4 w-4 mr-2" />
                Approve All
              </Button>
            </div>

            {/* Pending tags list */}
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {pendingTags.map((tag) => (
                  <div
                    key={tag.link.id}
                    className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    {/* Photo thumbnail */}
                    <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
                      <img
                        src={getPhotoUrl(tag.media)}
                        alt={tag.media.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tag.media.file_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">
                          {ROLE_LABELS[tag.link.role || 'other']}
                        </Badge>
                        {tag.link.is_primary_subject && (
                          <Badge className="bg-yellow-500 text-black">Primary Subject</Badge>
                        )}
                      </div>
                      <p className="text-sm text-white/50 mt-2">
                        Tagged {new Date(tag.link.added_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(tag, true)}
                        disabled={responding !== null}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {responding === tag.link.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRespond(tag, false)}
                        disabled={responding !== null}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
