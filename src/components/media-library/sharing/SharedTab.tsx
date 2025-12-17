/**
 * SharedTab Component
 *
 * Main container for the Shared tab in Media Library.
 * Shows incoming shares (shared with me) and outgoing shares (I'm sharing).
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Share2,
  Inbox,
  Send,
  Check,
  X,
  Copy,
  FolderOpen,
  Image as ImageIcon,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sharingService, type ShareWithDetails } from '@/services/media/sharing-service';

interface SharedTabProps {
  directoryProfileId?: string;
}

export function SharedTab({ directoryProfileId }: SharedTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [sharedWithMe, setSharedWithMe] = useState<ShareWithDetails[]>([]);
  const [imSharing, setImSharing] = useState<ShareWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [copyingFrom, setCopyingFrom] = useState<string | null>(null);

  // Collapsible sections
  const [showSharedWithMe, setShowSharedWithMe] = useState(true);
  const [showImSharing, setShowImSharing] = useState(true);

  const loadShares = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [incoming, outgoing] = await Promise.all([
        sharingService.getSharesSharedWithMe(user.id),
        sharingService.getSharesIAmSharing(user.id),
      ]);

      setSharedWithMe(incoming);
      setImSharing(outgoing);
    } catch (error) {
      console.error('Failed to load shares:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shared items',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    loadShares();
  }, [loadShares]);

  const handleRespond = async (shareId: string, accept: boolean) => {
    setRespondingTo(shareId);
    try {
      await sharingService.respondToShare(shareId, accept);
      toast({
        title: accept ? 'Share Accepted' : 'Share Declined',
        description: accept
          ? 'You now have access to this content'
          : 'The share has been declined',
      });
      loadShares();
    } catch (error) {
      console.error('Failed to respond to share:', error);
      toast({
        title: 'Error',
        description: 'Failed to respond to share',
        variant: 'destructive',
      });
    } finally {
      setRespondingTo(null);
    }
  };

  const handleCopyToProfile = async (shareId: string) => {
    if (!directoryProfileId) {
      toast({
        title: 'Error',
        description: 'No profile selected to copy to',
        variant: 'destructive',
      });
      return;
    }

    setCopyingFrom(shareId);
    try {
      await sharingService.copySharedMediaToProfile(shareId, directoryProfileId);
      toast({
        title: 'Content Copied',
        description: 'The shared content has been copied to your profile',
      });
    } catch (error) {
      console.error('Failed to copy shared content:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to copy content',
        variant: 'destructive',
      });
    } finally {
      setCopyingFrom(null);
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      await sharingService.revokeShare(shareId);
      toast({
        title: 'Share Revoked',
        description: 'Access to this content has been revoked',
      });
      loadShares();
    } catch (error) {
      console.error('Failed to revoke share:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke share',
        variant: 'destructive',
      });
    }
  };

  const pendingCount = sharedWithMe.filter(s => s.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Shared With Me Section */}
          <div>
            <button
              className="w-full flex items-center justify-between p-2 rounded hover:bg-accent"
              onClick={() => setShowSharedWithMe(!showSharedWithMe)}
            >
              <div className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                <h3 className="font-semibold">Shared With Me</h3>
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {pendingCount} pending
                  </Badge>
                )}
              </div>
              {showSharedWithMe ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showSharedWithMe && (
              <div className="mt-2 space-y-3">
                {sharedWithMe.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Share2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No one has shared anything with you yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  sharedWithMe.map((share) => (
                    <Card
                      key={share.id}
                      className={cn(
                        share.status === 'pending' && 'border-yellow-500/50 bg-yellow-500/5'
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Preview */}
                          <div className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                            {share.album?.cover_url ? (
                              <img
                                src={share.album.cover_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : share.media?.public_url ? (
                              <img
                                src={share.media.public_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {share.resource_type === 'album' ? (
                                  <FolderOpen className="h-6 w-6 text-muted-foreground/50" />
                                ) : (
                                  <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {share.status === 'pending' && (
                                <Badge variant="secondary" className="text-yellow-600 border-yellow-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              {share.status === 'accepted' && (
                                <Badge variant="secondary" className="text-green-600 border-green-600">
                                  <Check className="h-3 w-3 mr-1" />
                                  Accepted
                                </Badge>
                              )}
                            </div>

                            <p className="font-medium truncate">
                              {share.album?.name || share.media?.file_name || 'Shared Item'}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              {share.resource_type === 'album'
                                ? `Album - ${share.album?.item_count || 0} photos`
                                : 'Single Photo'}
                            </p>

                            {share.message && (
                              <p className="text-sm text-muted-foreground mt-1 italic">
                                "{share.message}"
                              </p>
                            )}

                            <p className="text-xs text-muted-foreground mt-2">
                              Shared {new Date(share.shared_at).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            {share.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleRespond(share.id, true)}
                                  disabled={respondingTo === share.id}
                                >
                                  {respondingTo === share.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Accept
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleRespond(share.id, false)}
                                  disabled={respondingTo === share.id}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                              </>
                            )}

                            {share.status === 'accepted' && share.can_copy && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleCopyToProfile(share.id)}
                                disabled={copyingFrom === share.id}
                              >
                                {copyingFrom === share.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy to Profile
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* I'm Sharing Section */}
          <div>
            <button
              className="w-full flex items-center justify-between p-2 rounded hover:bg-accent"
              onClick={() => setShowImSharing(!showImSharing)}
            >
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                <h3 className="font-semibold">I'm Sharing</h3>
                <Badge variant="secondary" className="text-xs">
                  {imSharing.length}
                </Badge>
              </div>
              {showImSharing ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showImSharing && (
              <div className="mt-2 space-y-3">
                {imSharing.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Send className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>You haven't shared anything yet</p>
                      <p className="text-sm mt-1">
                        Share albums from your library with other users or organizations
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  imSharing.map((share) => (
                    <Card key={share.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Preview */}
                          <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                            {share.resource_type === 'album' ? (
                              <FolderOpen className="w-full h-full p-3 text-muted-foreground/50" />
                            ) : (
                              <ImageIcon className="w-full h-full p-3 text-muted-foreground/50" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {share.album?.name || share.media?.file_name || 'Shared Item'}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              Shared with: {share.target?.name || 'Unknown'}
                            </p>

                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {share.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(share.shared_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRevoke(share.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default SharedTab;
