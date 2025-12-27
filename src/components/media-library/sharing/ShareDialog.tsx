/**
 * ShareDialog Component
 *
 * Dialog for sharing an album or media with other users/profiles/organizations.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  Search,
  User,
  Building2,
  UserCircle,
  Check,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  sharingService,
  type ShareTargetType,
} from '@/services/media/sharing-service';

interface ShareTarget {
  id: string;
  name: string;
  type: ShareTargetType;
  subtitle?: string;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  albumId?: string;
  albumName?: string;
  mediaId?: string;
  mediaName?: string;
  onSuccess?: () => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  albumId,
  albumName,
  mediaId,
  mediaName,
  onSuccess,
}: ShareDialogProps) {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ShareTarget[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<ShareTarget | null>(null);

  const [canCopy, setCanCopy] = useState(true);
  const [message, setMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedTarget(null);
      setCanCopy(true);
      setMessage('');
    }
  }, [open]);

  // Search for targets
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await sharingService.searchShareTargets(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleShare = async () => {
    if (!selectedTarget) return;

    setIsSharing(true);
    try {
      if (albumId) {
        await sharingService.shareAlbum(albumId, selectedTarget.type, selectedTarget.id, {
          canCopy,
          message: message.trim() || undefined,
        });
      } else if (mediaId) {
        await sharingService.shareMedia(mediaId, selectedTarget.type, selectedTarget.id, {
          canCopy,
          message: message.trim() || undefined,
        });
      }

      toast({
        title: 'Shared Successfully',
        description: `Shared with ${selectedTarget.name}`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to share:', error);
      toast({
        title: 'Error',
        description: 'Failed to share',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  const getTargetIcon = (type: ShareTargetType) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'profile':
        return <UserCircle className="h-4 w-4" />;
      case 'organization':
        return <Building2 className="h-4 w-4" />;
    }
  };

  const itemName = albumName || mediaName || 'item';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{itemName}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Target Selection */}
          {selectedTarget ? (
            <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
              <div className="flex items-center gap-2">
                {getTargetIcon(selectedTarget.type)}
                <div>
                  <p className="font-medium">{selectedTarget.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedTarget.subtitle}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedTarget(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Search for recipient</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users, profiles, organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Search Results */}
              {(searchResults.length > 0 || isSearching) && (
                <ScrollArea className="max-h-48 border rounded-md">
                  {isSearching ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="p-1">
                      {searchResults.map((target) => (
                        <button
                          key={`${target.type}-${target.id}`}
                          className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent text-left"
                          onClick={() => setSelectedTarget(target)}
                        >
                          {getTargetIcon(target.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{target.name}</p>
                            <p className="text-xs text-muted-foreground">{target.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No results found
                </p>
              )}
            </div>
          )}

          {/* Options */}
          {selectedTarget && (
            <>
              {/* Allow copying */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="can-copy">Allow copying</Label>
                  <p className="text-xs text-muted-foreground">
                    Recipient can copy content to their profile
                  </p>
                </div>
                <Switch
                  id="can-copy"
                  checked={canCopy}
                  onCheckedChange={setCanCopy}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a note for the recipient..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSharing}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={isSharing || !selectedTarget}>
            {isSharing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShareDialog;
